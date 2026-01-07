# 🔒 SECURITY NOTICE - Firebase Credentials

## ⚠️ CRITICAL: Firebase Service Account File Exposure

### Issue
The Firebase service account credentials file (`attendance-notifications-ce3eb-firebase-adminsdk-fbsvc-82a9e12b77.json`) contains sensitive information including:
- Private key
- Client email
- Project ID

**If this file was previously committed to git, the credentials are exposed in git history and must be rotated immediately.**

### Verification Status
✅ **Current Status**: The file is properly ignored by `.gitignore` and is NOT currently tracked by git.

### Required Actions

#### 1. **IMMEDIATE: Check Git History**
Check if the file was ever committed:
```bash
git log --all --full-history -- "attendance-notifications-ce3eb-firebase-adminsdk-fbsvc-82a9e12b77.json"
```

If the file appears in git history:

#### 2. **URGENT: Rotate Firebase Credentials**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a NEW service account key
3. **Delete the OLD service account** (or at least revoke its key)
4. Update your `.env` file with the new file path
5. Delete the old credentials file

#### 3. **Remove from Git History** (if committed)
If the file was committed, remove it from git history:
```bash
# Remove file from git history (use with caution - rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch attendance-notifications-ce3eb-firebase-adminsdk-fbsvc-82a9e12b77.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history on remote)
git push origin --force --all
```

**⚠️ WARNING**: Force pushing rewrites git history. Coordinate with your team before doing this.

#### 4. **Alternative: Use Environment Variables**
Instead of file path, use base64-encoded credentials in `.env`:
```env
# Convert JSON file to base64
# Linux/Mac: cat file.json | base64
# Windows: certutil -encode file.json encoded.txt

FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_json_string>
```

Or use individual environment variables:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### Current Protection
✅ File is in `.gitignore`
✅ File is not currently tracked by git
✅ The code supports multiple credential loading methods

### Best Practices Going Forward
1. ✅ Never commit credentials files to git
2. ✅ Use environment variables or secret management services
3. ✅ Rotate credentials regularly
4. ✅ Use different credentials for dev/staging/production
5. ✅ Monitor Firebase console for unauthorized access

---

**If credentials were exposed, rotate them IMMEDIATELY before they can be used maliciously.**
