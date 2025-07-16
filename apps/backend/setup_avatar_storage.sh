#!/bin/bash

# Avatar Storage Setup Script
# This script sets up the Supabase storage bucket and policies for avatar uploads

set -e

echo "🚀 Setting up avatar storage for Memos..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run from your project root."
    exit 1
fi

echo "📦 Creating avatars storage bucket..."

# Create the storage bucket
supabase storage create avatars --public || {
    echo "⚠️  Storage bucket might already exist, continuing..."
}

echo "🔐 Setting up storage policies..."

# Apply the SQL policies
supabase db push --file setup_avatar_storage.sql || {
    echo "⚠️  Some policies might already exist, continuing..."
}

echo "✅ Avatar storage setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the setup in your Supabase dashboard"
echo "2. Test avatar uploads from the frontend"
echo "3. Monitor storage usage in the dashboard"
echo ""
echo "🔧 Troubleshooting:"
echo "- If policies fail, try running them manually in the SQL editor"
echo "- Check that storage is enabled in your Supabase project"
echo "- Verify RLS is enabled on the storage.objects table"
echo ""
echo "📚 For more information, see AVATAR_STORAGE_SETUP.md" 