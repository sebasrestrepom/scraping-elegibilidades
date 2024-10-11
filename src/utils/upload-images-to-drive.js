const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(__dirname, '../../cred.json');

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const getOrCreateFolder = async (name, parentId = null) => {
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''}`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
};

const uploadToDrive = async (fileName, screenshotBuffer) => {
  try {
    const drive = google.drive({ version: 'v3', auth });

    const today = new Date();
    const year = today.getFullYear();
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today);
    const day = today.getDate().toString().padStart(2, '0');

    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const yearFolderId = await getOrCreateFolder(year.toString(), rootFolderId);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId);
    const dayFolderId = await getOrCreateFolder(day, monthFolderId);

    const tempFilePath = path.join(__dirname, fileName);
    fs.writeFileSync(tempFilePath, screenshotBuffer);

    const fileMetadata = {
      name: fileName,
      parents: [dayFolderId],
    };

    const media = {
      mimeType: 'image/png',
      body: fs.createReadStream(tempFilePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    fs.unlinkSync(tempFilePath);

    return response.data;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return null;
  }
};

module.exports = { uploadToDrive };
