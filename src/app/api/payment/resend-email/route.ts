import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Email sending is disabled. Students download ticket/invoice directly from the website.
export async function POST() {
  return NextResponse.json(
    { error: 'Email sending is disabled. Please download your ticket and invoice directly from the website.' },
    { status: 410 }
  );
}
