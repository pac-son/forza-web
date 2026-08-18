import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Prepare the form data exactly how Pinata expects it
    const pinataData = new FormData();
    pinataData.append('file', file, file.name);

    // Send the file to IPFS via Pinata
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataData,
    });

    const pinataRes = await res.json();

    if (!res.ok) {
      throw new Error(pinataRes.error?.details || "Failed to pin to IPFS");
    }

    // Return the cryptographic hash (CID) to the frontend
    return NextResponse.json({ ipfsHash: pinataRes.IpfsHash }, { status: 200 });

  } catch (error) {
    console.error("IPFS Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 500 });
  }
}