import type { AppStateSnapshot, HabitDraft } from '../types';
import { initialState, LocalStoreRepository } from '../storage/LocalStoreRepository';

type StateSink = (state: AppStateSnapshot) => void;

export class AppStateManager {
  private state: AppStateSnapshot = initialState;

  public constructor(
    private readonly repository: LocalStoreRepository,
    private readonly sink: StateSink
  ) {}

  public hydrate = async (): Promise<void> => {
    this.state = await this.repository.loadState();
    this.sink(this.state);
  };

  public replaceState = async (nextState: AppStateSnapshot): Promise<AppStateSnapshot> => {
    this.state = nextState;
    this.sink(nextState);
    await this.repository.saveState(nextState);
    return nextState;
  };

  public signIn = async (name: string): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      user: { name },
    }));
  };

  public signOut = async (): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      user: null,
    }));
  };

  public addHabit = async (habit: HabitDraft): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      habits: [
        ...previous.habits,
        {
          id: this.nextId(previous.habits),
          createdAt: new Date().toISOString(),
          isActive: true,
          ...habit,
          goalValue: String(habit.goalValue ?? ''),
        },
      ],
    }));
  };

  public updateHabit = async (habitId: number, payload: Partial<HabitDraft>): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      habits: previous.habits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              ...payload,
              goalValue: payload.goalValue === undefined ? habit.goalValue : String(payload.goalValue),
            }
          : habit
      ),
    }));
  };

  public toggleHabitActive = async (habitId: number): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      habits: previous.habits.map((habit) => (habit.id === habitId ? { ...habit, isActive: !habit.isActive } : habit)),
    }));
  };

  public deleteHabit = async (habitId: number): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      habits: previous.habits.filter((habit) => habit.id !== habitId),
      checkIns: previous.checkIns.filter((checkIn) => checkIn.habitId !== habitId),
    }));
  };

  public toggleCheckIn = async (habitId: number, date = this.todayString(), value?: number): Promise<AppStateSnapshot> => {
    return this.commit((previous) => {
      const index = previous.checkIns.findIndex((checkIn) => checkIn.habitId === habitId && checkIn.date === date);
      const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined;

      if (normalizedValue === undefined) {
        const exists = index >= 0;

        return {
          ...previous,
          checkIns: exists
            ? previous.checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date))
            : [
                ...previous.checkIns,
                {
                  id: this.nextId(previous.checkIns),
                  habitId,
                  date,
                  value: 1,
                  note: '',
                  createdAt: new Date().toISOString(),
                },
              ],
        };
      }

      if (normalizedValue <= 0) {
        return {
          ...previous,
          checkIns: previous.checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date)),
        };
      }

      const nextCheckIn = {
        id: index >= 0 ? previous.checkIns[index].id : this.nextId(previous.checkIns),
        habitId,
        date,
        value: normalizedValue,
        note: '',
        createdAt: index >= 0 ? previous.checkIns[index].createdAt : new Date().toISOString(),
      };

      return {
        ...previous,
        checkIns: index >= 0 ? previous.checkIns.map((checkIn, currentIndex) => (currentIndex === index ? nextCheckIn : checkIn)) : [...previous.checkIns, nextCheckIn],
      };
    });
  };

  public resetCheckIns = async (): Promise<AppStateSnapshot> => {
    return this.commit((previous) => ({
      ...previous,
      checkIns: [],
    }));
  };

  private async commit(updater: (state: AppStateSnapshot) => AppStateSnapshot): Promise<AppStateSnapshot> {
    const nextState = updater(this.state);
    this.state = nextState;
    this.sink(nextState);
    await this.repository.saveState(nextState);
    return nextState;
  }

  private nextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  private todayString(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
