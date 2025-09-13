use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ");

#[program]
pub mod contracts {
    use super::*;

    pub fn initialize_track(
        ctx: Context<InitializeTrack>,
        title: String,
        metadata_uri: String,
        total_supply: u64,
        price_per_token: u64,
        royalty_percentage: u16,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        track.artist = ctx.accounts.artist.key();
        track.title = title;
        track.metadata_uri = metadata_uri;
        track.total_supply = total_supply;
        track.price_per_token = price_per_token;
        track.royalty_percentage = royalty_percentage;
        track.tokens_sold = 0;
        track.total_royalties_collected = 0;
        track.is_tokenized = false;
        track.token_mint = Pubkey::default();
        track.bump = ctx.bumps.track;

        Ok(())
    }

    pub fn tokenize_track(ctx: Context<TokenizeTrack>) -> Result<()> {
        let track = &mut ctx.accounts.track;
        require!(!track.is_tokenized, ErrorCode::TrackAlreadyTokenized);
        require!(track.artist == ctx.accounts.artist.key(), ErrorCode::UnauthorizedArtist);

        let seeds = &[
            b"track",
            track.artist.as_ref(),
            track.title.as_bytes(),
            &[track.bump],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.artist_token_account.to_account_info(),
                    authority: track.to_account_info(),
                },
                signer,
            ),
            track.total_supply,
        )?;

        track.token_mint = ctx.accounts.token_mint.key();
        track.is_tokenized = true;

        Ok(())
    }

    pub fn distribute_royalties(ctx: Context<DistributeRoyalties>, royalty_amount: u64) -> Result<()> {
        let track = &mut ctx.accounts.track;
        require!(track.artist == ctx.accounts.artist.key(), ErrorCode::UnauthorizedArtist);

        let token_holders_share = royalty_amount
            .checked_mul(track.royalty_percentage as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        let artist_share = royalty_amount
            .checked_sub(token_holders_share)
            .ok_or(ErrorCode::MathOverflow)?;

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.royalty_payer.key(),
            &ctx.accounts.artist.key(),
            artist_share,
        );
        
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.royalty_payer.to_account_info(),
                ctx.accounts.artist.to_account_info(),
            ],
        )?;

        track.total_royalties_collected = track.total_royalties_collected
            .checked_add(royalty_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(RoyaltyDistributed {
            track: track.key(),
            total_amount: royalty_amount,
            token_holders_share,
            artist_share,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializeTrack<'info> {
    #[account(
        init,
        payer = artist,
        space = 8 + Track::INIT_SPACE,
        seeds = [b"track", artist.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub track: Account<'info, Track>,
    
    #[account(mut)]
    pub artist: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TokenizeTrack<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    
    #[account(
        init,
        payer = artist,
        mint::decimals = 0,
        mint::authority = track,
        mint::freeze_authority = track,
    )]
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = artist,
        associated_token::mint = token_mint,
        associated_token::authority = artist,
    )]
    pub artist_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub artist: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRoyalties<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    
    #[account(mut)]
    pub artist: Signer<'info>,
    
    /// CHECK: This account pays the royalties
    #[account(mut)]
    pub royalty_payer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Track {
    pub artist: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub token_mint: Pubkey,
    pub total_supply: u64,
    pub tokens_sold: u64,
    pub price_per_token: u64,
    pub royalty_percentage: u16,
    pub total_royalties_collected: u64,
    pub is_tokenized: bool,
    pub bump: u8,
}

#[event]
pub struct RoyaltyDistributed {
    pub track: Pubkey,
    pub total_amount: u64,
    pub token_holders_share: u64,
    pub artist_share: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Track is already tokenized")]
    TrackAlreadyTokenized,
    #[msg("Track is not tokenized yet")]
    TrackNotTokenized,
    #[msg("Unauthorized artist")]
    UnauthorizedArtist,
    #[msg("Insufficient token supply")]
    InsufficientTokenSupply,
    #[msg("Math overflow")]
    MathOverflow,
}