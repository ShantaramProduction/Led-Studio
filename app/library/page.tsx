import { CabinetLibraryPanel } from '../../components/CabinetLibraryPanel';

export default function LibraryPage() {
  return (
    <main className="dashboard-shell">
      <header className="topbar dashboard-topbar">
        <div className="brand">
          <strong>SHANTARAM Studio</strong>
          <span>Библиотека кабинетов</span>
        </div>
        <div className="top-actions">
          <a className="tool-button ghost" href="/">Назад</a>
        </div>
      </header>
      <section className="dashboard-content">
        <CabinetLibraryPanel
          labels={{
            title: 'Библиотека кабинетов',
            subtitle: 'Простая облачная библиотека: добавление, редактирование и удаление собственных кабинетов.',
            newCabinet: '+ Новый кабинет',
            save: 'Сохранить кабинет',
            delete: 'Удалить кабинет',
            name: 'Название',
            manufacturer: 'Производитель',
            size: 'Размер',
            resolution: 'Разрешение',
            weight: 'Вес, кг',
            averagePower: 'Средняя мощность, Вт',
            maxPower: 'Макс. мощность, Вт',
            receiverCard: 'Приёмная карта',
            configFile: 'Файл конфигурации',
            notes: 'Заметки',
            cloudOnly: 'Данные сохраняются в Supabase. Если Supabase не настроен, список будет пустым.',
          }}
        />
      </section>
    </main>
  );
}
