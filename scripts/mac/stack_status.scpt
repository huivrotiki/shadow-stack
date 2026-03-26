set result to do shell script "curl -s http://localhost:3001/health 2>&1 || echo 'offline'"
display dialog "Shadow Stack: " & result with title "Shadow Stack v4"
