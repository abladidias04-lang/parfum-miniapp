# Parfum Mini App — Толық нұсқаулық

## Стек
- React 19 + Vite
- Tailwind CSS
- Supabase (негізгі сайтпен БІР БАЗА)
- Telegram WebApp SDK

---

## 1-қадам: .env файлын жасау

```bash
cp .env.example .env
```

`.env` ішіне негізгі сайтыңның Supabase URL мен KEY-ін қой:
```
VITE_SUPABASE_URL=https://gkzvkhvzbquhxzxxakpw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Суpabase → Settings → API-дан аласың.

---

## 2-қадам: GitHub-қа жүктеу

```bash
cd parfum_miniapp
git init
git add .
git commit -m "Parfum Mini App"
git remote add origin https://github.com/USERNAME/parfum-miniapp.git
git branch -M main
git push -u origin main
```

---

## 3-қадам: Vercel-ге деплой

1. vercel.com → GitHub-пен кір
2. "Add New Project" → parfum-miniapp repo-ны таңда
3. **Environment Variables** бөліміне қос:
   - `VITE_SUPABASE_URL` = суpabase URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
4. Deploy басасың

URL аласың: `https://parfum-miniapp-xxx.vercel.app`

---

## 4-қадам: BotFather баптау

```
/mybots → өз ботың → Bot Settings → Menu Button → Configure menu button
URL: https://parfum-miniapp-xxx.vercel.app
Text: 🛍 Каталог
```

---

## 5-қадам: main.py-ға handler қосу

`handlers_webapp.py` → `parfum_bot/handlers/webapp.py`

`parfum_bot/main.py` ішіне:
```python
from handlers.webapp import handle_webapp_data
# order_conv-дан кейін:
app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
```

---

## Жұмыс принципі

Клиент → 🛍 Каталог батырмасы → Mini App ашылады  
→ Парфюм таңдайды (сурет, сипаттама, ұқсас парфюмдер)  
→ Себетке қосады → "Тапсырыс беру"  
→ Бот заказ тізімін жібереді → Kaspi реквизит  
→ Клиент чек жібереді → Gemini тексереді → Админге хабар
