# 🧾 Palfare – The Transparent Bitcoin Donation Platform

**Website:** [https://palfare.com](https://palfare.com)  
**Status:** MVP Live 🚀  
**License:** MIT  
**Stack:** Next.js · Vercel · Supabase · BlockCypher API · Tailwind CSS

---

## ✨ What Is Palfare?

**Palfare** is a voluntary alternative to state welfare – a modern platform for transparent Bitcoin-based giving.

Anyone — individuals, creators, nonprofits, or even local governments — can:
- Share a donation page with a **Bitcoin address + live QR code**
- Show **real-time incoming/outgoing transactions**
- Add **public notes explaining how funds are used**

No coercion. No middlemen. No fees. Just radical transparency.

---

## 🎯 Key Features

- 📲 **Personal Donation Pages** — Public Bitcoin wallet, QR code, and purpose
- 🔍 **Real-Time Transactions** — Synced from the Bitcoin blockchain
- 🧾 **Public Annotations** — Anyone can see how funds are used
- 🌍 **Global Performance** — Powered by Vercel CDN and DNS Fast Anycast
- 🔐 **No Custody** — You keep your private keys; we show public activity only

---

## 🛠️ Tech Stack

| Layer             | Tech Used                      |
|------------------|--------------------------------|
| Frontend         | Next.js (React) + Tailwind CSS |
| Hosting          | Vercel                         |
| Blockchain API   | BlockCypher                    |
| Auth & DB        | Supabase (PostgreSQL)          |
| Storage          | Cloudflare R2 (planned)        |
| Email            | Resend.com (planned)           |
| Monitoring       | Sentry, Vercel Analytics       |

---

## 🚀 Getting Started

### 1. Clone the Repo

`git clone https://github.com/palfare/palfare.git`  
`cd palfare`

### 2. Install Dependencies

`npm install`

### 3. Configure Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_WALLET_ADDRESS=bc1qyourwalletaddress
BLOCKCYPHER_API_KEY=your_blockcypher_key
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_supabase_public_key
```

> Never commit `.env` files.

### 4. Start Development Server

`npm run dev`

Visit [http://localhost:3000](http://localhost:3000)

---

## 🧪 How to Test the MVP

- Send BTC to your wallet address  
- Watch the donation appear on your public page  
- Annotate it with a human-readable explanation (in v2)  
- See the balance and transaction log update live

---

## 📦 Deployment

### 1. Push to GitHub

Commit and push your code to a GitHub repository.

### 2. Connect to Vercel

- Log into [Vercel](https://vercel.com)
- Click **New Project** → Import your GitHub repo
- Set environment variables in **Settings → Environment Variables**
- Deploy

### 3. Connect Custom Domain

- Point DNS at Vercel from your domain registrar (e.g., Infomaniak)
- Add `palfare.com` and `www.palfare.com` in your Vercel domain settings
- Enable HTTPS (Vercel does this automatically)

---

## 🔐 Security Notes

- No private keys are stored or processed  
- Public Bitcoin data only (read-only)  
- DNSSEC, domain privacy, and Anycast DNS enabled via Infomaniak

---

## 📈 Roadmap

### ✅ Phase 1 – MVP

- Public donation page  
- Live Bitcoin QR + balance  
- Real-time transaction feed  

### 🚧 Phase 2 – In Progress

- User login + dashboard  
- Public transaction notes  
- Email integration  

### 🔮 Phase 3 – Planned

- Multiple wallets per user  
- Milestone-based donations  
- Donor acknowledgements  
- Analytics dashboard  

---

## 💡 Philosophy

> “Replace coercion with cooperation. Replace mandates with trust. Replace bureaucracy with code.”

Palfare is a **non-violent, voluntary system of support**. It's transparent, censorship-resistant, and built for people who believe accountability beats ideology.

---

## 🤝 Contributing

Pull requests welcome. Open an issue, fork the repo, or shoot us a message.

---

## 🧠 Credits

- Built by Georg Butaev with ❤️ in Switzerland  
- Code & design by the Palfare team  
- Inspired by Bitcoin, open-source culture, and the desire to build non-coercive safety nets

---

## 📄 License

MIT — free to fork, remix, and improve

---

✅ Let me know when you're ready for `package.json`, `vercel.json`, or `.gitignore` templates — or if you want help bootstrapping the first Next.js page with QR and blockchain integration.
