import type { AppStateSnapshot, HabitDraft, UserProfile } from '../types';
import { initialState, normalizeCheckIn, normalizeHabit, normalizeUser } from '../storage/AppStateStorage';
import type { AppStateRepository } from '../storage/AppStateStorage';

type StateSink = (state: AppStateSnapshot) => void;

export class AppStateManager {
  private state: AppStateSnapshot = initialState;

  public constructor(
    private readonly repository: AppStateRepository,
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

  public signIn = async (user: UserProfile): Promise<AppStateSnapshot> => {
    const nextUser = normalizeUser(user);
    return this.commit(
      (previous) => ({
        ...previous,
        user: nextUser,
      }),
      () => this.repository.saveUser(nextUser)
    );
  };

  public updateProfile = async (user: Partial<UserProfile>): Promise<AppStateSnapshot> => {
    const nextUser = normalizeUser(
      this.state.user
        ? {
            ...this.state.user,
            ...user,
            name: user.name?.trim() || this.state.user.name,
            email: user.email === undefined ? this.state.user.email : user.email?.trim() || undefined,
            picture: user.picture === undefined ? this.state.user.picture : user.picture?.trim() || undefined,
            focusGoal: user.focusGoal === undefined ? this.state.user.focusGoal : user.focusGoal?.trim() || undefined,
            accentColor: user.accentColor === undefined ? this.state.user.accentColor : user.accentColor?.trim() || undefined,
          }
        : user.name
          ? {
              ...user,
              name: String(user.name).trim(),
              email: user.email?.trim() || undefined,
              picture: user.picture?.trim() || undefined,
              focusGoal: user.focusGoal?.trim() || undefined,
              accentColor: user.accentColor?.trim() || undefined,
            }
          : null
    );

    return this.commit(
      (previous) => ({
        ...previous,
        user: nextUser,
      }),
      () => this.repository.saveUser(nextUser)
    );
  };

  public signOut = async (): Promise<AppStateSnapshot> => {
    return this.commit(
      () => ({
        user: null,
        habits: [],
        checkIns: [],
      }),
      () => this.repository.resetState()
    );
  };

  public addHabit = async (habit: HabitDraft): Promise<AppStateSnapshot> => {
    const nextHabit = normalizeHabit({
      id: this.nextId(this.state.habits),
      createdAt: new Date().toISOString(),
      isActive: true,
      ...habit,
      goalValue: String(habit.goalValue ?? ''),
    });

    return this.commit(
      (previous) => ({
        ...previous,
        habits: [...previous.habits, nextHabit],
      }),
      () => this.repository.upsertHabit(nextHabit)
    );
  };

  public updateHabit = async (habitId: number, payload: Partial<HabitDraft>): Promise<AppStateSnapshot> => {
    const currentHabit = this.state.habits.find((habit) => habit.id === habitId);
    if (!currentHabit) {
      return this.state;
    }

    const nextHabit = normalizeHabit({
      ...currentHabit,
      ...payload,
      goalValue: payload.goalValue === undefined ? currentHabit.goalValue : String(payload.goalValue),
    });

    return this.commit(
      (previous) => ({
        ...previous,
        habits: previous.habits.map((habit) => (habit.id === habitId ? nextHabit : habit)),
      }),
      () => this.repository.upsertHabit(nextHabit)
    );
  };

  public toggleHabitActive = async (habitId: number): Promise<AppStateSnapshot> => {
    const currentHabit = this.state.habits.find((habit) => habit.id === habitId);
    if (!currentHabit) {
      return this.state;
    }

    const nextHabit = normalizeHabit({ ...currentHabit, isActive: !currentHabit.isActive });

    return this.commit(
      (previous) => ({
        ...previous,
        habits: previous.habits.map((habit) => (habit.id === habitId ? nextHabit : habit)),
      }),
      () => this.repository.upsertHabit(nextHabit)
    );
  };

  public deleteHabit = async (habitId: number): Promise<AppStateSnapshot> => {
    return this.commit(
      (previous) => ({
        ...previous,
        habits: previous.habits.filter((habit) => habit.id !== habitId),
      }),
      () => this.repository.deleteHabit(habitId)
    );
  };

  public toggleCheckIn = async (habitId: number, date = this.todayString(), value?: number, note?: string): Promise<AppStateSnapshot> => {
    return this.commit((previous) => {
      const index = previous.checkIns.findIndex((checkIn) => checkIn.habitId === habitId && checkIn.date === date);
      const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined;
      const trimmedNote = note?.trim();
      const habit = previous.habits.find((item) => item.id === habitId);

      if (normalizedValue === undefined) {
        const exists = index >= 0;
        const nextCheckIn = normalizeCheckIn({
          id: this.nextId(previous.checkIns),
          habitId,
          habitName: habit?.name,
          habitColor: habit?.color,
          date,
          value: 1,
          note: trimmedNote ?? '',
          createdAt: new Date().toISOString(),
        });

        return {
          ...previous,
          checkIns: exists
            ? previous.checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date))
            : [...previous.checkIns, nextCheckIn],
        };
      }

      if (normalizedValue <= 0) {
        return {
          ...previous,
          checkIns: previous.checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date)),
        };
      }

      const nextCheckIn = normalizeCheckIn({
        id: index >= 0 ? previous.checkIns[index].id : this.nextId(previous.checkIns),
        habitId,
        habitName: habit?.name ?? previous.checkIns[index]?.habitName,
        habitColor: habit?.color ?? previous.checkIns[index]?.habitColor,
        date,
        value: normalizedValue,
        note: trimmedNote ?? previous.checkIns[index]?.note ?? '',
        createdAt: index >= 0 ? previous.checkIns[index].createdAt : new Date().toISOString(),
      });

      return {
        ...previous,
        checkIns: index >= 0 ? previous.checkIns.map((checkIn, currentIndex) => (currentIndex === index ? nextCheckIn : checkIn)) : [...previous.checkIns, nextCheckIn],
      };
    }, async (nextState, previousState) => {
      const previousCheckIn = previousState.checkIns.find((checkIn) => checkIn.habitId === habitId && checkIn.date === date);
      const nextCheckIn = nextState.checkIns.find((checkIn) => checkIn.habitId === habitId && checkIn.date === date);

      if (!nextCheckIn && previousCheckIn) {
        await this.repository.deleteCheckIn(habitId, date);
        return;
      }

      if (nextCheckIn) {
        await this.repository.upsertCheckIn(nextCheckIn);
      }
    });
  };

  public resetCheckIns = async (): Promise<AppStateSnapshot> => {
    return this.commit(
      (previous) => ({
        ...previous,
        checkIns: [],
      }),
      () => this.repository.replaceCheckIns([])
    );
  };

  public getHistorySections = async () => {
    return this.repository.getHistorySections();
  };

  public getDashboardMetrics = async () => {
    return this.repository.getDashboardMetrics();
  };

  public getTodaySummary = async (date?: string) => {
    return this.repository.getTodaySummary(date);
  };

  private async commit(
    updater: (state: AppStateSnapshot) => AppStateSnapshot,
    persist?: (nextState: AppStateSnapshot, previousState: AppStateSnapshot) => Promise<void>
  ): Promise<AppStateSnapshot> {
    const previousState = this.state;
    const nextState = updater(previousState);
    this.state = nextState;
    this.sink(nextState);

    if (persist) {
      await persist(nextState, previousState);
    } else {
      await this.repository.saveState(nextState);
    }

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
