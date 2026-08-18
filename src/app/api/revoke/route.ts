// src/app/api/revoke/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import FORZA_ABI from "@/abi/Forza.json";

export async function POST(req: Request) {
    try {
        const { tokenId } = await req.json();

        if (tokenId === undefined) {
            return NextResponse.json({ error: "Missing Token ID" }, { status: 400 });
        }

        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const privateKey = process.env.INSTITUTION_PRIVATE_KEY;

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey!, provider);
        const contract = new ethers.Contract(contractAddress!, FORZA_ABI.abi, wallet);

        console.log(`Revoking certificate with Token ID: ${tokenId}...`);
        
        // Call the built-in contract function
        const tx = await contract.revokeCertificate(tokenId);
        const receipt = await tx.wait();

        if (receipt.status === 0) {
            throw new Error("Transaction reverted on-chain.");
        }

        return NextResponse.json({ 
            success: true, 
            message: `Token ID ${tokenId} has been successfully revoked.`,
            txHash: receipt.hash 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Revocation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to revoke certificate" }, { status: 500 });
    }
}