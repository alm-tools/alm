#Resume work on a new machine

git -c diff.mnemonicprefix=false -c core.quotepath=false fetch origin
git -c diff.mnemonicprefix=false -c core.quotepath=false pull --rebase origin master

npm install
