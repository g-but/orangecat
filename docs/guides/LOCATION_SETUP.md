# Location Entry Setup Guide

**Created:** 2025-11-24  
**Last Modified:** 2025-11-24  
**Last Modified Summary:** Updated to use Nominatim (OpenStreetMap) - no API key needed!

---

## 🎉 No Setup Required!

**Location entry now uses Nominatim (OpenStreetMap) API** - it's completely free and requires **zero configuration**!

- ✅ **No API key needed**
- ✅ **No account required**
- ✅ **No billing setup**
- ✅ **Works globally**
- ✅ **Free forever**

---

## 🚀 How It Works

### For Users

1. Type city name (e.g., "Zurich")
2. See instant suggestions
3. Click to select
4. Done!

### For Developers

The `LocationInput` component automatically:

- Uses Nominatim API for city/address search
- Falls back to zip code lookup for known countries
- Handles rate limiting (1 request/second)
- Works globally without any configuration

---

## 📊 Technical Details

### API Used: Nominatim (OpenStreetMap)

- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Rate Limit:** 1 request/second (automatically handled)
- **Cost:** FREE
- **Coverage:** Global

### Features

- ✅ City name search
- ✅ Address search
- ✅ Zip code lookup (for supported countries)
- ✅ Swiss canton detection
- ✅ State/province detection
- ✅ Latitude/longitude coordinates

---

## 🔧 Implementation

### Component: `LocationInput`

```tsx
import { LocationInput } from '@/components/ui/LocationInput';

<LocationInput
  value={location}
  onChange={locationData => {
    // locationData contains:
    // - country, city, zipCode
    // - state, stateCode (if applicable)
    // - canton, cantonCode (for Switzerland)
    // - latitude, longitude
    // - formattedAddress
  }}
/>;
```

### Utilities

- `src/lib/nominatim.ts` - Nominatim API wrapper
- `src/lib/global-location.ts` - Zip code lookup utilities
- `src/lib/swiss-location.ts` - Swiss-specific location utilities

---

## ⚙️ Rate Limiting

Nominatim has a rate limit of **1 request per second**. The component automatically:

- Debounces input (500ms)
- Throttles requests (1 second minimum between requests)
- Shows loading indicators

**For production:** If you expect high traffic, consider:

- Caching results
- Using a self-hosted Nominatim instance
- Or switching to Google Places API (requires setup)

---

## 🆚 Comparison: Nominatim vs Google Places

| Feature        | Nominatim (Current) | Google Places                   |
| -------------- | ------------------- | ------------------------------- |
| **Setup**      | ✅ Zero             | ❌ Requires API key             |
| **Cost**       | ✅ Free             | 💰 ~$1.70/month (at your scale) |
| **Rate Limit** | 1 req/sec           | Unlimited (with billing)        |
| **UX**         | Good                | Excellent                       |
| **Coverage**   | Global              | Global                          |

**Recommendation:** Start with Nominatim (current). Switch to Google Places only if you need:

- Faster response times
- Higher rate limits
- More polished UX

---

## 🐛 Troubleshooting

### No suggestions appearing

- Check browser console for errors
- Verify internet connection
- Try typing a well-known city name

### Slow response

- Normal - Nominatim has 1 req/sec rate limit
- Suggestions appear after 500ms debounce + API call

### Missing locations

- Try typing the city name in English
- Try typing the country name after city (e.g., "Zurich Switzerland")

---

## 📚 References

- [Nominatim API Documentation](https://nominatim.org/release-docs/develop/api/Overview/)
- [OpenStreetMap](https://www.openstreetmap.org/)




























