---
name: check-container-memory
description: Runs a script that lists the top memory-consuming processes in each running Docker container (sorted by %MEM). Use when checking container memory usage, debugging OOM, profiling processes per container, or when the user asks to see what is using RAM in their containers.
---

# Check container memory

## Instructions

1. Ensure Docker is available and containers are running (`docker ps`).
2. Execute the script from the repo (or copy the path):

   ```bash
   bash skills/check-container-memory/scripts/top-mem-by-container.sh
   ```

3. Optional: set how many rows per container (default 15):

   ```bash
   TOP_N=20 bash skills/check-container-memory/scripts/top-mem-by-container.sh
   ```

## Limits

- Uses `docker exec` and `ps` inside each container. Images without `ps` show a short message; suggest `docker top <container>` as a fallback for process names from the host.
- Sort key is `%MEM` from `ps aux` (GNU/BusyBox layouts may differ slightly).
- Does not include stopped containers.

## Additional resources

- Script source: [scripts/top-mem-by-container.sh](scripts/top-mem-by-container.sh)
