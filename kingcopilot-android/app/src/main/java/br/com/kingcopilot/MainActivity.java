package br.com.kingcopilot;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(48, 72, 48, 48);
        root.setBackgroundColor(Color.rgb(14,15,18));

        TextView title = new TextView(this);
        title.setText("KING COPILOT");
        title.setTextColor(Color.WHITE);
        title.setTextSize(30);
        title.setGravity(Gravity.CENTER_HORIZONTAL);
        root.addView(title);

        TextView info = new TextView(this);
        info.setText("\nAnálise automática de ofertas do Uber Driver.\n\n1. Toque no botão abaixo\n2. Ative King Copilot em Acessibilidade\n3. Volte para o Uber Driver\n4. Quando aparecer uma oferta, o painel tentará calcular R$/km e R$/hora automaticamente.\n\nO app NÃO aceita nem recusa corridas.");
        info.setTextColor(Color.LTGRAY);
        info.setTextSize(16);
        root.addView(info);

        Button btn = new Button(this);
        btn.setText("ATIVAR ACESSIBILIDADE");
        btn.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
        root.addView(btn);

        setContentView(root);
    }
}
