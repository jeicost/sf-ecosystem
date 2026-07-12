import { google } from 'googleapis'

interface UploadResult {
  success: boolean
  fileId?: string
  webViewLink?: string
  error?: string
}

export async function uploadToDrive(
  fileName: string,
  mimeType: string,
  fileContent: string | Buffer
): Promise<UploadResult> {
  // Validate env vars
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return {
      success: false,
      error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured. Contact admin to set up Google Drive integration.',
    }
  }

  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return {
      success: false,
      error: 'GOOGLE_DRIVE_FOLDER_ID not configured. Contact admin to set up Google Drive integration.',
    }
  }

  try {
    // Parse service account key
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)

    // Create JWT auth
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Create file
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    }

    const media = {
      mimeType,
      body: fileContent,
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    })

    return {
      success: true,
      fileId: response.data.id || undefined,
      webViewLink: response.data.webViewLink || undefined,
    }
  } catch (error) {
    console.error('Google Drive upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to Google Drive',
    }
  }
}
