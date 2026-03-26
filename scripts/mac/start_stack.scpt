do shell script "cd /Users/work/shadow-stack_local_1 && doppler run -- node server/index.js > /tmp/stack.log 2>&1 &"
display notification "Shadow Stack запущен" with title "Shadow Stack v4"
