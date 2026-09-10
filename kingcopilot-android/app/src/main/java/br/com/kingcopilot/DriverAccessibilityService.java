package br.com.kingcopilot;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DriverAccessibilityService extends AccessibilityService {

    private static final Pattern PRICE = Pattern.compile("(?i)(?:R\\$|RS)\\s*([0-9]{1,4}(?:[.,][0-9]{2})?)");
    private static final Pattern PAIR = Pattern.compile("(?i)(\\d{1,3})\\s*(?:min|minutos?)[^0-9]{0,30}([0-9]{1,3}(?:[.,][0-9])?)\\s*km");

    private WindowManager wm;
    private View overlay;
    private long lastShown = 0L;
    private String lastKey = "";

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString().toLowerCase(Locale.ROOT);

        if (!(pkg.equals("com.ubercab.driver") || (pkg.contains("uber") && pkg.contains("driver")))) {
            if (overlay != null && SystemClock.elapsedRealtime() - lastShown > 8000) overlay.setVisibility(View.GONE);
            return;
        }

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;

        List<String> texts = new ArrayList<>();
        collectText(root, texts);
        root.recycle();

        analyze(texts);
    }

    private void collectText(AccessibilityNodeInfo node, List<String> out) {
        if (node == null) return;
        CharSequence t = node.getText();
        CharSequence d = node.getContentDescription();
        if (t != null && t.length() > 0) out.add(t.toString());
        if (d != null && d.length() > 0) out.add(d.toString());

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                collectText(child, out);
                child.recycle();
            }
        }
    }

    private void analyze(List<String> lines) {
        String joined = String.join("\n", lines).replace("RS", "R$");
        Matcher pm = PRICE.matcher(joined);
        if (!pm.find()) return;

        Double price = brNumber(pm.group(1));
        if (price == null || price <= 0) return;

        Matcher m = PAIR.matcher(joined);
        List<Integer> mins = new ArrayList<>();
        List<Double> kms = new ArrayList<>();
        while (m.find() && mins.size() < 2) {
            try {
                mins.add(Integer.parseInt(m.group(1)));
                Double km = brNumber(m.group(2));
                if (km != null) kms.add(km);
            } catch (Exception ignored) {}
        }

        if (mins.isEmpty() || kms.isEmpty()) return;

        int pickupMin = mins.get(0);
        double pickupKm = kms.get(0);
        int tripMin = mins.size() > 1 ? mins.get(1) : 0;
        double tripKm = kms.size() > 1 ? kms.get(1) : 0.0;

        double totalKm = pickupKm + tripKm;
        int totalMin = pickupMin + tripMin;
        if (totalKm <= 0 || totalMin <= 0) return;

        double perKm = price / totalKm;
        double perHour = price / totalMin * 60.0;

        String key = price + "|" + pickupMin + "|" + pickupKm + "|" + tripMin + "|" + tripKm;
        long now = SystemClock.elapsedRealtime();
        if (key.equals(lastKey) && now - lastShown < 10000) return;
        lastKey = key;
        lastShown = now;

        show(price, perKm, perHour, pickupKm, pickupMin, tripKm, tripMin);
    }

    private void show(double price, double perKm, double perHour,
                      double pickupKm, int pickupMin, double tripKm, int tripMin) {
        if (overlay == null) createOverlay();
        if (overlay == null) return;

        LinearLayout box = (LinearLayout) overlay;
        TextView verdict = (TextView) box.getChildAt(1);
        TextView metrics = (TextView) box.getChildAt(2);
        TextView route = (TextView) box.getChildAt(3);

        boolean good = perKm >= 1.80 && perHour >= 35.0;
        boolean limit = perKm >= 1.50 && perHour >= 30.0;

        verdict.setText((good ? "BOA CORRIDA" : limit ? "NO LIMITE" : "FRACA") + "  " + brl(price));
        verdict.setTextColor(good ? Color.rgb(90,255,120) : limit ? Color.rgb(255,210,70) : Color.rgb(255,90,90));
        metrics.setText(String.format(Locale.forLanguageTag("pt-BR"), "R$ %.2f/km   •   R$ %.2f/h", perKm, perHour));
        route.setText(String.format(Locale.forLanguageTag("pt-BR"), "Busca %.1f km / %d min   •   Corrida %.1f km / %d min",
                pickupKm, pickupMin, tripKm, tripMin));
        overlay.setVisibility(View.VISIBLE);
    }

    private void createOverlay() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(28, 20, 28, 20);
        box.setBackgroundColor(Color.argb(235, 12, 14, 18));

        TextView title = tv("KING COPILOT", 13, Color.rgb(150,255,160));
        TextView verdict = tv("ANALISANDO...", 18, Color.WHITE);
        TextView metrics = tv("", 16, Color.WHITE);
        TextView route = tv("", 13, Color.LTGRAY);
        box.addView(title);
        box.addView(verdict);
        box.addView(metrics);
        box.addView(route);

        WindowManager.LayoutParams p = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT
        );
        p.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        p.y = 120;

        wm.addView(box, p);
        overlay = box;
    }

    private TextView tv(String s, int sp, int color) {
        TextView v = new TextView(this);
        v.setText(s);
        v.setTextSize(sp);
        v.setTextColor(color);
        return v;
    }

    private Double brNumber(String raw) {
        try {
            String s = raw.trim();
            if (s.contains(",")) s = s.replace(".", "").replace(',', '.');
            return Double.parseDouble(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String brl(double v) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(v);
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        if (overlay != null && wm != null) {
            try { wm.removeView(overlay); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
