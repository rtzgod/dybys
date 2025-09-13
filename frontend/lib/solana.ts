import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { 
  TOKEN_PROGRAM_ID, 
  createInitializeMintInstruction, 
  createAssociatedTokenAccountInstruction, 
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint 
} from '@solana/spl-token';

// Program ID from our smart contract
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ');
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'http://localhost:8899';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface BlockchainTrack {
  mintAddress: string;
  metadataUri: string;
  totalSupply: number;
  pricePerToken: number;
  royaltyPercentage: number;
  artist: string;
  isTokenized: boolean;
}

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
  }

  /**
   * Get SOL balance for a wallet
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
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
    trackTitle: string,
    totalSupply: number,
    pricePerToken: number,
    royaltyPercentage: number
  ): Promise<{
    signature: string;
    tokenMint: string;
    metadataUri: string;
  }> {
    const provider = await this.getProvider(wallet);
    
    if (!provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Generate mint keypair
      const mintKeypair = web3.Keypair.generate();
      
      // Get minimum rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
      
      // Create metadata
      const metadata: TokenMetadata = {
        name: `${trackTitle} Token`,
        symbol: 'MUSIC',
        description: `Investment token for the music track: ${trackTitle}`,
        image: `https://api.dybys.com/track-image/${encodeURIComponent(trackTitle)}`,
        external_url: 'https://dybys.com',
        attributes: [
          { trait_type: 'Type', value: 'Music Token' },
          { trait_type: 'Total Supply', value: totalSupply },
          { trait_type: 'Price per Token', value: `${pricePerToken} SOL` },
          { trait_type: 'Royalty Percentage', value: `${royaltyPercentage / 100}%` }
        ]
      };

      // Upload metadata (in real app, this would go to IPFS)
      const metadataUri = await this.uploadMetadata(metadata);

      // Build transaction
      const transaction = new Transaction();

      // Create mint account instruction
      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      });

      // Initialize mint instruction
      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        0, // 0 decimals for non-fungible-like tokens
        provider.publicKey,
        provider.publicKey,
        TOKEN_PROGRAM_ID
      );

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        provider.publicKey
      );

      // Create associated token account instruction
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        provider.publicKey,
        associatedTokenAccount,
        provider.publicKey,
        mintKeypair.publicKey
      );

      // Mint all tokens to artist initially
      const mintToInstruction = createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        provider.publicKey,
        totalSupply // No decimals, so totalSupply as-is
      );

      // Add all instructions to transaction
      transaction.add(
        createMintAccountInstruction,
        initializeMintInstruction,
        createATAInstruction,
        mintToInstruction
      );

      // Get recent blockhash and set fee payer
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      // Sign with mint keypair
      transaction.partialSign(mintKeypair);

      // Sign with wallet and send
      const signedTransaction = await wallet.signTransaction!(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      return {
        signature,
        tokenMint: mintKeypair.publicKey.toString(),
        metadataUri
      };
    } catch (error) {
      console.error('Error tokenizing track:', error);
      throw new Error('Failed to tokenize track on blockchain');
    }
  }

  async buyTokens(
    wallet: WalletContextState,
    tokenMint: string,
    artistWallet: string,
    amount: number,
    pricePerToken: number
  ): Promise<{
    signature: string;
    amount: number;
    totalCost: number;
  }> {
    const provider = await this.getProvider(wallet);
    
    if (!provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const mintPublicKey = new PublicKey(tokenMint);
      const artistPublicKey = new PublicKey(artistWallet);
      const totalCostLamports = Math.floor(amount * pricePerToken * LAMPORTS_PER_SOL);

      // Get or create investor's associated token account
      const investorTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        provider.publicKey
      );

      // Get artist's associated token account
      const artistTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        artistPublicKey
      );

      const transaction = new Transaction();

      // Create investor's token account if it doesn't exist
      const investorAccountInfo = await this.connection.getAccountInfo(investorTokenAccount);
      if (!investorAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            provider.publicKey,
            investorTokenAccount,
            provider.publicKey,
            mintPublicKey
          )
        );
      }

      // Payment to artist
      const paymentInstruction = SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: artistPublicKey,
        lamports: totalCostLamports
      });
      transaction.add(paymentInstruction);

      // Note: In a real implementation, token transfers would be handled by a smart contract
      // The contract would atomically: 1) receive SOL from investor, 2) transfer tokens from artist to investor
      // For this demo, we only handle the SOL payment. Token ownership is tracked in the app state.

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction!(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      return {
        signature,
        amount,
        totalCost: totalCostLamports / LAMPORTS_PER_SOL,
      };
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw new Error('Failed to complete token purchase');
    }
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

  /**
   * Distribute royalties to token holders proportionally based on their token balance
   * Uses app store investment data to determine token ownership since we don't have a full smart contract
   */
  async distributeRoyaltiesProportionally(
    wallet: WalletContextState,
    tokenMint: string,
    totalAmount: number,
    description?: string,
    investmentData?: Array<{
      investorId: string;
      amount: number; // number of tokens owned
    }>
  ): Promise<{
    signature: string;
    totalDistributed: number;
    recipients: Array<{
      wallet: string;
      amount: number;
      tokens: number;
      percentage: number;
    }>;
  }> {
    const provider = await this.getProvider(wallet);
    
    if (!provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Check artist's SOL balance
      const artistBalance = await this.getBalance(provider.publicKey);
      if (artistBalance < totalAmount) {
        throw new Error(`Insufficient SOL balance. You have ${artistBalance.toFixed(3)} SOL but need ${totalAmount.toFixed(3)} SOL`);
      }

      // Use investment data if provided (hybrid approach for demo), otherwise try blockchain data
      let tokenHolders: Array<{ wallet: string; balance: number }> = [];
      
      if (investmentData && investmentData.length > 0) {
        // Use app store investment data to simulate token ownership
        tokenHolders = investmentData.map(investment => ({
          wallet: investment.investorId,
          balance: investment.amount
        }));
      } else {
        // Try to get real blockchain token holders (may be empty for demo)
        const blockchainHolders = await this.getTokenHolders(tokenMint);
        tokenHolders = blockchainHolders.map(holder => ({
          wallet: holder.wallet,
          balance: holder.balance
        }));
      }
      
      if (tokenHolders.length === 0) {
        throw new Error('No token holders found for this track');
      }

      // Calculate total tokens in circulation (excluding artist's tokens if any)
      const totalTokensInCirculation = tokenHolders
        .filter(holder => holder.wallet !== provider.publicKey.toString())
        .reduce((sum, holder) => sum + holder.balance, 0);

      if (totalTokensInCirculation === 0) {
        throw new Error('No tokens held by investors (all tokens are held by artist)');
      }

      // Calculate proportional distribution
      const recipients = tokenHolders
        .filter(holder => holder.wallet !== provider.publicKey.toString()) // Exclude artist
        .filter(holder => holder.balance > 0) // Only holders with tokens
        .map(holder => {
          const percentage = (holder.balance / totalTokensInCirculation) * 100;
          const amount = (holder.balance / totalTokensInCirculation) * totalAmount;
          return {
            wallet: holder.wallet,
            amount: amount,
            tokens: holder.balance,
            percentage: percentage
          };
        })
        .filter(recipient => recipient.amount >= 0.000001); // Minimum distribution threshold (1 microSOL)

      if (recipients.length === 0) {
        throw new Error('No valid recipients for royalty distribution');
      }

      // Build transaction with payment instructions
      const transaction = new Transaction();
      let actualTotalDistributed = 0;

      for (const recipient of recipients) {
        const recipientPublicKey = new PublicKey(recipient.wallet);
        const amountLamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL);
        
        if (amountLamports > 0) {
          const paymentInstruction = SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: recipientPublicKey,
            lamports: amountLamports
          });
          transaction.add(paymentInstruction);
          actualTotalDistributed += recipient.amount;
        }
      }

      if (transaction.instructions.length === 0) {
        throw new Error('No valid payment instructions generated');
      }

      // Get recent blockhash and set fee payer
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction!(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      console.log('Royalty distribution completed:', {
        signature,
        totalDistributed: actualTotalDistributed,
        recipients: recipients.length,
        description
      });

      return {
        signature,
        totalDistributed: actualTotalDistributed,
        recipients
      };
    } catch (error) {
      console.error('Error distributing royalties:', error);
      throw error;
    }
  }

  /**
   * Legacy function - kept for backward compatibility
   */
  async distributeRoyalties(
    wallet: WalletContextState,
    tokenMint: string,
    totalAmount: number,
    recipients: Array<{
      wallet: string;
      amount: number;
    }>
  ): Promise<{
    signature: string;
    totalDistributed: number;
  }> {
    const provider = await this.getProvider(wallet);
    
    if (!provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = new Transaction();
      let totalDistributed = 0;

      // Add payment instructions for each recipient
      for (const recipient of recipients) {
        const recipientPublicKey = new PublicKey(recipient.wallet);
        const amountLamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL);
        
        if (amountLamports > 0) {
          const paymentInstruction = SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: recipientPublicKey,
            lamports: amountLamports
          });
          transaction.add(paymentInstruction);
          totalDistributed += recipient.amount;
        }
      }

      if (transaction.instructions.length === 0) {
        throw new Error('No valid recipients for royalty distribution');
      }

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.publicKey;

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction!(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      return {
        signature,
        totalDistributed
      };
    } catch (error) {
      console.error('Error distributing royalties:', error);
      throw new Error('Failed to distribute royalties');
    }
  }

  /**
   * Upload metadata to IPFS (placeholder implementation)
   */
  async uploadMetadata(metadata: TokenMetadata): Promise<string> {
    try {
      // In a real implementation, you would upload to IPFS, Arweave, or another decentralized storage
      // For now, we'll simulate this with a deterministic hash
      const metadataString = JSON.stringify(metadata);
      const hash = Array.from(metadataString)
        .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
        .toString(16);
      
      return `https://gateway.pinata.cloud/ipfs/Qm${hash.padStart(44, '0')}`;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw new Error('Failed to upload metadata');
    }
  }

  /**
   * Get token holders for a mint with real balance data
   */
  async getTokenHolders(tokenMint: string): Promise<Array<{
    wallet: string;
    balance: number;
    tokenAccount: string;
  }>> {
    try {
      const mintPublicKey = new PublicKey(tokenMint);
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          {
            dataSize: 165, // Token account data size
          },
          {
            memcmp: {
              offset: 0, // mint address starts at offset 0
              bytes: mintPublicKey.toBase58(),
            },
          },
        ],
      });

      const holders: Array<{ wallet: string; balance: number; tokenAccount: string }> = [];
      
      for (const { pubkey, account } of tokenAccounts) {
        try {
          // Parse token account data
          // Token account structure: mint(32) + owner(32) + amount(8) + ...
          const data = account.data;
          
          // Extract owner (32 bytes starting at offset 32)
          const owner = new PublicKey(data.slice(32, 64));
          
          // Extract amount (8 bytes starting at offset 64)
          const amountBuffer = data.slice(64, 72);
          const amount = Number(BigInt('0x' + Buffer.from(amountBuffer).reverse().toString('hex')));
          
          if (amount > 0) {
            holders.push({
              wallet: owner.toString(),
              balance: amount,
              tokenAccount: pubkey.toString()
            });
          }
        } catch (error) {
          console.warn('Failed to parse token account:', pubkey.toString(), error);
        }
      }

      return holders;
    } catch (error) {
      console.error('Error getting token holders:', error);
      return [];
    }
  }

  async getConnection() {
    return this.connection;
  }
}

export const solanaService = new SolanaService();