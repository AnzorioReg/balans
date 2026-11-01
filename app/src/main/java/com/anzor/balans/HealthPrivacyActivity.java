package com.anzor.balans;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.ScrollView;

/** In-app rationale required by Health Connect. No external health-data processing. */
public class HealthPrivacyActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        TextView text = new TextView(this);
        text.setPadding(48, 56, 48, 56);
        text.setTextSize(17);
        text.setText("Данные здоровья в «Балансе»\n\n"
            + "С вашего согласия приложение читает разрешённые показатели Health Connect "
            + "для личного обзора активности, сна, состава тела и измерений здоровья.\n\n"
            + "Чтение выполняется при нажатии «Синхронизировать». "
            + "Данные и настройки хранятся локально на телефоне. "
            + "Они не отправляются на сервер, рекламодателям или другим пользователям. "
            + "Вы можете явно экспортировать записи в файл.\n\n"
            + "Bluetooth-приборы передают измерения напрямую на телефон. "
            + "Поддержка зависит от стандартного протокола конкретного прибора.\n\n"
            + "Доступ можно изменить или отозвать в настройках Health Connect. "
            + "Локальные копии измерений можно удалить в «Конфиденциальности» приложения.\n\n"
            + "Приложение не является медицинским прибором и не ставит диагнозы.");
        scroll.addView(text);
        setContentView(scroll);
    }
}
