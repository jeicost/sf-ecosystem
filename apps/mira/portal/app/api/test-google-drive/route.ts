import { NextResponse } from 'next/server'
import { uploadToDrive } from '@/lib/google-drive'

export async function GET() {
  try {
    // Create a test HTML file
    const testContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MIRA Google Drive Test</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; max-width: 600px; }
    .success { color: green; }
    .timestamp { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>✅ MIRA Google Drive Upload Test</h1>
  <p>This is a test file uploaded from MIRA Portal.</p>
  <p class="timestamp">Generated at: ${new Date().toISOString()}</p>
  <p>If you can see this file in your Google Drive folder "MIRA Exports", the integration is working!</p>
</body>
</html>
    `.trim()

    // Upload to Google Drive
    const result = await uploadToDrive(
      `MIRA_Test_${Date.now()}.html`,
      'text/html',
      testContent
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Google Drive integration working!',
        fileId: result.fileId,
        driveUrl: result.webViewLink,
        testFile: `Check your Google Drive folder for: MIRA_Test_${Date.now()}.html`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        hint: 'Check that GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DRIVE_FOLDER_ID are set in .env.local',
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
