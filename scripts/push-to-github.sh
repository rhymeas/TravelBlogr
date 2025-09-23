
#!/bin/bash

# Automated GitHub push script
echo "🚀 Starting automated GitHub push..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Initializing..."
    git init
    echo "✅ Git repository initialized"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub remote found. Please set up your GitHub repository first."
    echo "Run: git remote add origin https://github.com/yourusername/yourrepo.git"
    exit 1
fi

# Add all changes
echo "📁 Adding all changes..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit. Repository is up to date."
    exit 0
fi

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

# Commit changes
echo "💾 Committing changes with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. Trying to pull and merge first..."
    
    # Try to pull and merge
    git pull origin main --rebase 2>/dev/null || git pull origin master --rebase 2>/dev/null
    
    # Try pushing again
    if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
        echo "✅ Successfully pushed to GitHub after rebase!"
    else
        echo "❌ Push failed. Please check your GitHub credentials and repository access."
        exit 1
    fi
fi

echo "🎉 Automation complete!"
