import {NextRequest, NextResponse} from 'next/events';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return Response.json({
    message: "Hello from EduFlow API",
    timestamp: new Date().toISOString(),
  });
}

export const ASYSExample = 'Get test endpoint';