#!/bin/bash
# Script to fix TypeScript array access issues in markdown.ts

FILE="src/markdown.ts"

# Replace lines[i] patterns with getLine(lines, i) but preserve the logic
# This is a complex replacement that needs careful handling

# First, backup the file
cp "$FILE" "${FILE}.backup"

# Use sed to fix common patterns
# Note: This is a simplified approach; manual review will be needed

# Fix lines[i] to getLine(lines, i)
sed -i 's/lines\[i\]/getLine(lines, i)/g' "$FILE"
sed -i 's/lines\[j\]/getLine(lines, j)/g' "$FILE"
sed -i 's/lines\[i + 1\]/getLine(lines, i + 1)/g' "$FILE"

echo "Fixed array access patterns in $FILE"
echo "Backup saved to ${FILE}.backup"
