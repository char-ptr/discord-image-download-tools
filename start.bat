@echo off
title Self bot
if not exist node_modules npm i
node index 
timeout /t -1