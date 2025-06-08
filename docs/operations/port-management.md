# Port Management Guide
## Handling Development Server Port Conflicts

---

## 🚨 Problem
Sometimes Node.js development servers don't terminate properly when you stop them (Ctrl+C), leaving processes running in the background. These hanging processes occupy ports 3000-3010, preventing new dev servers from starting.

---

## ✅ Solution

### **🚀 Quick Commands**

1. **Kill hanging processes:**
   ```bash
   npm run kill-ports
   ```

2. **Start dev server with cleanup:**
   ```bash
   npm run dev:clean
   ```

3. **Start dev server on specific port:**
   ```bash
   npm run dev:port
   # This runs on port 3020 to avoid conflicts
   ```

### **📜 Batch Scripts**

- `scripts/kill-dev-processes.bat` - Interactive script to kill Node.js processes
- `scripts/dev-with-cleanup.bat` - Automatically cleans up and starts dev server

---

## 🎯 Best Practices

1. **Always use Ctrl+C properly** to stop the dev server
2. **If Ctrl+C doesn't work**, close the terminal window completely
3. **Before starting dev server**, run `npm run kill-ports` if you suspect hanging processes
4. **Use `npm run dev:clean`** instead of `npm run dev` if you frequently have port conflicts

---

## 🔧 Troubleshooting

### **🔍 If you still have port conflicts:**

1. **Check what's using the ports:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Kill specific process by PID:**
   ```bash
   powershell "Stop-Process -Id [PID] -Force"
   ```

3. **Kill all Node.js processes:**
   ```bash
   npm run kill-ports
   ```

---

## 🤔 Why This Happens

- **Improper termination** of dev servers
- **System crashes** while dev server is running
- **Multiple terminal sessions** running dev servers
- **Background processes** that didn't clean up properly

---

## 📚 Related Documentation

- [Development Setup](../SETUP.md) - Complete development environment setup
- [Troubleshooting](troubleshooting.md) - Common development issues
- [Maintenance](maintenance.md) - Regular maintenance procedures 