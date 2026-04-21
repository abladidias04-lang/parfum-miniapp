"""
handlers/webapp.py — Mini App-тан келген СЕБЕТ заказын қабылдайды
main.py-ға қосу:
    from handlers.webapp import handle_webapp_data
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
"""
import json
from telegram import Update
from telegram.ext import ContextTypes
from config import ADMIN_IDS
from services.db import upsert_client, supabase
from datetime import datetime


async def handle_webapp_data(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    msg  = update.message
    user = update.effective_user

    try:
        data = json.loads(msg.web_app_data.data)
    except Exception:
        await msg.reply_text("❌ Деректер қате келді.")
        return

    items       = data.get("items", [])
    total_price = int(data.get("total_price", 0))
    is_opt      = bool(data.get("is_opt", False))
    order_type  = data.get("order_type", "Опт")

    if not items:
        await msg.reply_text("❌ Себет бос.")
        return

    # Клиентті тіркеу
    upsert_client(user.id, user.username, user.full_name)

    # DB-ге заказ жазу (бірнеше item — JSON ретінде)
    order_data = {
        "telegram_id":   user.id,
        "aroma_key":     "multi_item",
        "aroma_name":    f"{len(items)} түрлі парфюм",
        "volume_ml":     0,
        "quantity":      sum(i["quantity"] for i in items),
        "unit_price":    0,
        "total_price":   total_price,
        "is_opt":        is_opt,
        "delivery_type": "pending",
        "status":        "pending_payment",
        "payment_note":  json.dumps(items, ensure_ascii=False),
        "created_at":    datetime.utcnow().isoformat(),
    }
    res = supabase.table("orders").insert(order_data).execute()
    order_id = res.data[0]["id"] if res.data else "—"

    # Контекстке сақта (чек handler үшін)
    ctx.user_data["pending_order_id"]    = order_id
    ctx.user_data["pending_order_total"] = total_price

    # Клиентке жауап — заказ тізімі
    lines = [f"🎉 *Заказ №{order_id} қабылданды!*\n"]
    for i, item in enumerate(items, 1):
        brand = f"{item['brand']} " if item.get('brand') else ""
        lines.append(
            f"{i}. {brand}{item['name']} {item['volume_ml']}мл "
            f"× {item['quantity']} = *{item['subtotal']:,}₸*"
        )
    lines.append(f"\n💰 Жалпы: *{total_price:,}₸* ({'💎 Опт' if is_opt else '🛍 Бөлшек'})")
    lines.append(f"\n💳 Төлем реквизиті:\nKaspi: `+7 777 000 00 00` (Айгерім С.)\n")
    lines.append("Төлегеннен кейін *чек/скриншотыңызды* осы чатқа жіберіңіз.")

    await msg.reply_text("\n".join(lines), parse_mode="Markdown")

    # Админге хабарлама
    admin_lines = [f"🛍 *Жаңа заказ \\#{order_id}* \\(Mini App\\)\n"]
    admin_lines.append(f"👤 @{user.username or '—'} \\({user.full_name}\\)")
    admin_lines.append(f"📦 {'💎 Опт' if is_opt else '🛍 Бөлшек'} | {len(items)} тауар")
    for item in items:
        brand = f"{item['brand']} " if item.get('brand') else ""
        admin_lines.append(f"• {brand}{item['name']} {item['volume_ml']}мл × {item['quantity']}")
    admin_lines.append(f"💰 Жалпы: *{total_price:,}₸*")

    for admin_id in ADMIN_IDS:
        try:
            await ctx.bot.send_message(
                admin_id,
                "\n".join(admin_lines),
                parse_mode="MarkdownV2",
            )
        except Exception:
            try:
                plain = f"Жаңа заказ #{order_id}\n{user.full_name}\n{total_price:,}₸"
                await ctx.bot.send_message(admin_id, plain)
            except Exception:
                pass
