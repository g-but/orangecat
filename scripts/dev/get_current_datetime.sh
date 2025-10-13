#!/bin/bash

# Get Current Date and Time
# 
# This script provides the current date and time in various formats.
# It can be used to ensure consistent date/time usage across the project.
# 
# Created: June 5, 2025
# Last Modified: June 5, 2025
# Last Modified Summary: Initial creation

# Get current date and time
NOW=$(date)

# Get ISO format
ISO=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Get date only (YYYY-MM-DD)
DATE_ONLY=$(date +"%Y-%m-%d")

# Get time only (HH:mm:ss)
TIME_ONLY=$(date +"%H:%M:%S")

# Get full date and time (YYYY-MM-DD HH:mm:ss)
FULL_DATETIME=$(date +"%Y-%m-%d %H:%M:%S")

# Get Unix timestamp
UNIX_TIMESTAMP=$(date +%s)

# Output all formats
echo "Current Date and Time:"
echo "---------------------"
echo "Full Format: $NOW"
echo "ISO Format: $ISO"
echo "Date Only: $DATE_ONLY"
echo "Time Only: $TIME_ONLY"
echo "Full DateTime: $FULL_DATETIME"
echo "Unix Timestamp: $UNIX_TIMESTAMP"

# Export variables for use in other scripts
export NOW
export ISO
export DATE_ONLY
export TIME_ONLY
export FULL_DATETIME
export UNIX_TIMESTAMP 