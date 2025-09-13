import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Program ID from our smart contract
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ');
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'http://localhost:8899';

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
  }

  async getProvider(wallet: WalletContextState) {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    return new AnchorProvider(
      this.connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }

  async initializeTrack(
    wallet: WalletContextState,
    title: string,
    metadataUri: string,
    totalSupply: number,
    pricePerToken: number,
    royaltyPercentage: number
  ) {
    const provider = await this.getProvider(wallet);
    
    // This would use the actual IDL from the compiled program
    // For now, we'll simulate the transaction structure
    const [trackPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('track'), provider.publicKey.toBuffer(), Buffer.from(title)],
      PROGRAM_ID
    );

    // Create instruction (this would use the actual program interface)
    const instruction = SystemProgram.createAccount({
      fromPubkey: provider.publicKey,
      newAccountPubkey: trackPda,
      space: 1000, // Estimated space for track account
      lamports: await this.connection.getMinimumBalanceForRentExemption(1000),
      programId: PROGRAM_ID,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await provider.sendAndConfirm(transaction);

    return {
      signature,
      trackPda: trackPda.toString(),
    };
  }

  async tokenizeTrack(
    wallet: WalletContextState,
    trackPda: string
  ) {
    const provider = await this.getProvider(wallet);
    
    // Create token mint
    const mintKeypair = web3.Keypair.generate();
    
    // This would create the actual tokenization transaction
    const signature = await provider.connection.requestAirdrop(
      provider.publicKey,
      web3.LAMPORTS_PER_SOL
    );

    return {
      signature,
      tokenMint: mintKeypair.publicKey.toString(),
    };
  }

  async buyTokens(
    wallet: WalletContextState,
    trackPda: string,
    amount: number,
    pricePerToken: number
  ) {
    const provider = await this.getProvider(wallet);
    
    const totalCost = amount * pricePerToken * web3.LAMPORTS_PER_SOL;
    
    // Create buy tokens transaction
    const transaction = new Transaction();
    
    const signature = await provider.sendAndConfirm(transaction);

    return {
      signature,
      amount,
      totalCost: totalCost / web3.LAMPORTS_PER_SOL,
    };
  }

  async getTrackData(trackPda: string) {
    try {
      const trackAccount = await this.connection.getAccountInfo(new PublicKey(trackPda));
      if (!trackAccount) {
        throw new Error('Track not found');
      }
      
      // Parse account data (this would use the actual program interface)
      return {
        isTokenized: true,
        totalSupply: 100,
        tokensSold: 25,
        pricePerToken: 0.1,
      };
    } catch (error) {
      console.error('Error fetching track data:', error);
      throw error;
    }
  }

  async getConnection() {
    return this.connection;
  }
}

export const solanaService = new SolanaService();