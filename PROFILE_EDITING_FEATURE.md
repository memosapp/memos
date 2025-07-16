# Profile Editing Feature

This document describes the new profile editing functionality that allows users to update their display name and avatar from the settings page.

## Features

### ✨ What's New

- **Display Name Editing**: Users can update their display name with real-time validation
- **Avatar Upload**: Users can upload and change their profile picture
- **Live Preview**: See changes before saving
- **Form Validation**: Comprehensive validation with user-friendly error messages
- **Storage Management**: Automatic cleanup of old avatars
- **Responsive Design**: Works seamlessly on all devices

### 🔧 Technical Implementation

#### Frontend Components

- **Enhanced Settings Page**: `/apps/frontend/app/settings/page.tsx`
  - Toggle between view and edit modes
  - Real-time form validation
  - File upload handling
  - Avatar preview functionality
  - Character counter for display name

#### Backend Storage

- **Supabase Storage Integration**: Secure file upload and management
- **User-Isolated Storage**: Each user has their own avatar folder
- **Automatic Cleanup**: Old avatars are removed when new ones are uploaded
- **Public CDN**: Avatars are served via Supabase's CDN for performance

## Setup Instructions

### 1. Configure Supabase Storage

#### Option A: Automated Setup

```bash
cd apps/backend
./setup_avatar_storage.sh
```

#### Option B: Manual Setup

1. Run the SQL commands in `apps/backend/setup_avatar_storage.sql`
2. Create the "avatars" bucket in Supabase dashboard
3. Set up the storage policies

### 2. Verify Setup

1. Check that the "avatars" bucket exists in your Supabase storage
2. Ensure storage policies are active
3. Test avatar upload functionality

## Usage

### For Users

1. Navigate to Settings page
2. Click "Edit Profile" button
3. Update display name and/or upload new avatar
4. Preview changes before saving
5. Click "Save Changes" to apply

### For Developers

The profile editing functionality is automatically available once the storage is set up. No additional configuration needed.

## Validation Rules

### Display Name

- **Minimum length**: 2 characters
- **Maximum length**: 50 characters
- **Required**: Cannot be empty
- **Trimmed**: Leading/trailing whitespace removed

### Avatar Upload

- **File size limit**: 2MB maximum
- **Supported formats**: All image types (jpg, png, gif, webp, etc.)
- **Automatic naming**: Files are renamed to prevent conflicts
- **User isolation**: Users can only access their own avatars

## Security Features

### Storage Policies

- **Upload**: Users can only upload to their own folder
- **Update**: Users can only update their own avatars
- **Delete**: Users can only delete their own avatars
- **Read**: Public read access for displaying avatars

### File Validation

- Server-side file type validation
- Size limits enforced
- Automatic sanitization of file names

### User Authentication

- All operations require valid authentication
- User metadata is updated securely through Supabase Auth

## File Structure

```
apps/
├── frontend/
│   └── app/
│       └── settings/
│           └── page.tsx              # Enhanced settings page
├── backend/
│   ├── setup_avatar_storage.sql     # SQL setup script
│   ├── setup_avatar_storage.sh      # Automated setup script
│   ├── AVATAR_STORAGE_SETUP.md      # Storage setup documentation
│   └── ...
└── ...
```

## Storage Structure

Avatars are organized in Supabase storage as follows:

```
avatars/
├── user-id-1/
│   └── 1642123456789.jpg
├── user-id-2/
│   └── 1642123456790.png
└── ...
```

## Error Handling

### User-Friendly Messages

- Clear validation errors for display name
- Informative upload error messages
- Success confirmation on save

### Technical Error Handling

- Network failure recovery
- File upload retry logic
- Graceful degradation for storage issues

## Performance Considerations

### Frontend Optimizations

- File preview without upload
- Debounced validation
- Efficient state management
- Minimal re-renders

### Backend Optimizations

- CDN delivery for avatars
- Automatic old file cleanup
- Efficient storage organization
- Proper cache headers

## Testing

### Manual Testing Checklist

- [ ] Display name validation (empty, too short, too long)
- [ ] Avatar upload (various formats, size limits)
- [ ] Edit mode toggle functionality
- [ ] Cancel changes functionality
- [ ] Save changes with success feedback
- [ ] Error handling for network issues
- [ ] Responsive design on different screen sizes

### Automated Testing

Consider adding tests for:

- Form validation logic
- File upload functionality
- Storage policy enforcement
- Error boundary behavior

## Common Issues & Solutions

### 1. Storage Bucket Not Found

**Problem**: Avatar upload fails with "bucket not found" error
**Solution**: Run the setup script or create the bucket manually

### 2. Permission Denied

**Problem**: Users can't upload avatars
**Solution**: Check that storage policies are correctly set up

### 3. Large File Upload Fails

**Problem**: Files over 2MB fail to upload
**Solution**: This is intentional - inform users about the size limit

### 4. Old Avatar Not Removed

**Problem**: Previous avatar remains in storage
**Solution**: Check that the cleanup logic is working properly

## Future Enhancements

### Short Term

- [ ] Crop/resize functionality for uploaded images
- [ ] Progress indicator for file uploads
- [ ] Drag and drop avatar upload
- [ ] Remove avatar option

### Long Term

- [ ] Image compression before upload
- [ ] Thumbnail generation
- [ ] Avatar history/versioning
- [ ] Bulk profile management (admin)
- [ ] Social media profile import

## API Changes

### Authentication Updates

The profile editing uses existing Supabase Auth APIs:

- `supabase.auth.updateUser()` for display name updates
- `supabase.storage.from('avatars').upload()` for avatar uploads

### State Management

Profile data is managed in the Redux store:

- `profileSlice.ts` updated to handle user metadata
- Local state for edit mode and form validation

## Migration Notes

### Existing Users

- No database migration required
- Existing user metadata remains unchanged
- New fields are optional and backward compatible

### Deployment

1. Deploy backend changes first
2. Set up storage bucket and policies
3. Deploy frontend changes
4. Test functionality end-to-end

## Monitoring

### Key Metrics

- Avatar upload success rate
- Storage usage growth
- Profile update frequency
- Error rates by type

### Storage Monitoring

- Monitor storage quota usage
- Track file upload patterns
- Check for orphaned files

## Support

For issues with the profile editing feature:

1. Check the setup documentation
2. Verify storage policies are active
3. Test with different file types and sizes
4. Check browser console for errors
5. Review Supabase logs for backend issues

## Contributing

When contributing to this feature:

1. Follow existing code patterns
2. Add appropriate error handling
3. Update documentation
4. Test on multiple devices
5. Consider accessibility requirements
