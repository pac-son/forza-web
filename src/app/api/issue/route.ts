import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { db } from '@/db';
import { studentWallets } from '@/db/schema';
import ForzaContract from '@/abi/Forza.json'; // 👈 Crucial: Imports the compiled smart contract

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// The AES-256-GCM encryption logic
function encryptPrivateKey(privateKey: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    let encryptedData = cipher.update(privateKey, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return { encryptedData, iv: iv.toString('hex'), authTag };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentMatricNum, studentName, programme, graduationYear, ipfsCID } = body;

        // 1. Generate the random EOA for the student
        const wallet = ethers.Wallet.createRandom();

        // 2. Encrypt the private key securely before it touches the database
        const { encryptedData, iv, authTag } = encryptPrivateKey(wallet.privateKey);

        // 3. Save the encrypted wallet to NeonDB using Drizzle
        const [savedWallet] = await db.insert(studentWallets).values({
            studentMatricNum,
            publicAddress: wallet.address,
            encryptedKey: encryptedData,
            iv,
            authTag,
            issuanceStatus: "PENDING"
        }).returning(); 

        // 4. SMART CONTRACT INTERACTION
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const institutionWallet = new ethers.Wallet(process.env.INSTITUTION_PRIVATE_KEY!, provider);
        
        // Connect to Forza using the correct NEXT_PUBLIC variable
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, 
            ForzaContract.abi, 
            institutionWallet
        );

        console.log("Initiating blockchain transaction...");
        const tx = await contract.issueCertificate(
            wallet.address,
            studentName,
            programme,
            graduationYear,
            ipfsCID
        );

        
        // Wait for the block to be permanently mined

        // 3. Parse the receipt logs to find the Transfer event or Mint event
        // For a standard ERC-721, the first topic or event contains the Token ID
        // Wait for the block to be permanently mined
        const receipt = await tx.wait();

        // Parse the transaction logs to find the exact Token ID that was minted
        let tokenId = "0"; // Default fallback
        if (receipt.logs) {
            for (const log of receipt.logs) {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    // The standard ERC-721 Transfer event: Transfer(from, to, tokenId)
                    if (parsedLog && parsedLog.name === 'Transfer') {
                        tokenId = parsedLog.args[2].toString();
                        break;
                    }
                } catch (e) {
                    // Ignore logs that don't belong to our contract interface
                    continue; 
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Success! Wallet secured and NFT Certificate minted on-chain.",
            studentAddress: wallet.address,
            transactionHash: receipt.hash,
            tokenId: tokenId // 👈 We are now sending the ID back to the browser!
        }, { status: 201 });

    } catch (error) {
        console.error("Issuance Error:", error);
        return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
    }
}