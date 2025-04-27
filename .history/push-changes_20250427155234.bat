@echo off
echo Pushing changes to GitHub...
git add .
git commit -m "Auto update: %date% %time%"
git push -u origin main
echo Done!