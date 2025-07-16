# Avatar Storage Setup

This document explains how to set up Supabase storage for user avatar uploads.

## Prerequisites

- Supabase project with authentication enabled
- Database access to run SQL commands
- Storage feature enabled in Supabase

## Setup Instructions

### 1. Create Storage Bucket

Run the SQL commands in `setup_avatar_storage.sql` to create the storage bucket and policies:

```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 2. Set Up Storage Policies

The policies ensure that:

- Users can only upload/update/delete their own avatars
- Anyone can view avatars (public read access)
- Files are organized by user ID in folders

### 3. Alternative Setup Methods

#### Option A: Using Supabase Dashboard

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named "avatars"
3. Make it public
4. Set up the policies using the SQL editor

#### Option B: Using Supabase CLI

```bash
# Create the bucket
supabase storage create avatars --public

# Apply the policies
supabase db push
```

## Storage Structure

Avatars are stored in the following structure:

```
avatars/
├── user-id-1/
│   ├── 1642123456789.jpg
│   └── 1642123456790.png
├── user-id-2/
│   ├── 1642123456791.jpg
│   └── 1642123456792.png
└── ...
```

## Security Features

### User Isolation

- Each user has their own folder
- Users can only access their own avatars
- Automatic cleanup of old avatars when new ones are uploaded

### File Validation

- Maximum file size: 2MB
- Supported formats: All image types (jpg, png, gif, webp, etc.)
- Automatic filename generation to prevent conflicts

### Policies

- **Upload Policy**: Users can only upload to their own folder
- **Update Policy**: Users can only update their own avatars
- **Delete Policy**: Users can only delete their own avatars
- **Read Policy**: Public read access for displaying avatars

## Troubleshooting

### Common Issues

1. **Storage bucket not found**

   - Ensure the bucket is created and named "avatars"
   - Check that storage is enabled in your Supabase project

2. **Permission denied errors**

   - Verify that RLS policies are correctly set up
   - Check that the user is authenticated

3. **Upload failures**
   - Ensure file size is under 2MB
   - Check that file is a valid image format
   - Verify network connectivity

### Policy Debugging

If the main policies don't work, try the simpler alternatives in the SQL file:

```sql
-- More permissive policies for testing
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);
```

## Configuration

### Environment Variables

No additional environment variables are needed. The storage client uses the same Supabase configuration as the auth client.

### Frontend Configuration

The frontend automatically handles:

- File validation
- Upload progress
- Error handling
- Old avatar cleanup

## Monitoring

### Storage Usage

Monitor storage usage in the Supabase dashboard:

- Total storage used
- Number of files
- Bandwidth usage

### Common Metrics

- Average file size: ~50-200KB
- Typical formats: JPG (60%), PNG (30%), other (10%)
- Upload success rate: Should be >95%

## Best Practices

1. **File Size Limits**: Keep the 2MB limit to ensure good performance
2. **Format Support**: Accept all image formats for better UX
3. **Cleanup**: Always remove old avatars when uploading new ones
4. **Caching**: Use appropriate cache headers (3600s default)
5. **Error Handling**: Provide clear error messages to users

## Future Enhancements

1. **Image Processing**: Add thumbnail generation
2. **CDN Integration**: Use a CDN for better performance
3. **Compression**: Automatically compress large images
4. **Backup**: Regular backup of avatar storage
5. **Analytics**: Track upload patterns and usage
