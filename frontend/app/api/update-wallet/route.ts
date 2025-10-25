import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, accessToken } = body;

    if (!walletAddress || !accessToken) {
      return NextResponse.json(
        { error: 'walletAddress and accessToken are required' },
        { status: 400 }
      );
    }

    // Verify the access token first
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, wallet_address')
      .eq('access_token', accessToken)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Only update if the current wallet_address is null
    if (user.wallet_address === null) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('user_id', user.user_id);

      if (updateError) {
        console.error('Failed to update wallet address:', updateError);
        return NextResponse.json(
          { error: 'Failed to update wallet address' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Wallet address updated successfully',
        wallet_address: walletAddress,
      });
    } else {
      // Wallet address already exists, no update needed
      return NextResponse.json({
        success: true,
        message: 'Wallet address already exists',
        wallet_address: user.wallet_address,
      });
    }
  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
