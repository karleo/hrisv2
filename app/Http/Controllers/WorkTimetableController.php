<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkTimetable\StoreWorkTimetableRequest;
use App\Http\Requests\WorkTimetable\UpdateWorkTimetableRequest;
use App\Models\Employee;
use App\Models\WorkTimetable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkTimetableController extends Controller
{
    /**
     * Display a listing of work timetables (weekly master templates).
     */
    public function index(Request $request): Response
    {
        $timetables = WorkTimetable::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('name', 'like', '%'.$request->search.'%')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('work-timetables/index', [
            'timetables' => $timetables,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new work timetable.
     */
    public function create(): Response
    {
        return Inertia::render('work-timetables/create');
    }

    /**
     * Store a newly created work timetable with seven weekday rows.
     */
    public function store(StoreWorkTimetableRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $scheduleDays = $data['schedule_days'];
        unset($data['schedule_days']);

        $timetable = WorkTimetable::query()->create($data);
        $this->syncWorkTimetableDays($timetable, $scheduleDays);

        return to_route('work-timetables.index')->with('success', 'Work timetable created.');
    }

    /**
     * Show the form for editing the specified work timetable.
     */
    public function edit(WorkTimetable $work_timetable): Response
    {
        $work_timetable->load('days');

        return Inertia::render('work-timetables/edit', [
            'workTimetable' => $work_timetable,
        ]);
    }

    /**
     * Update the work timetable and its weekday rows.
     */
    public function update(UpdateWorkTimetableRequest $request, WorkTimetable $work_timetable): RedirectResponse
    {
        $data = $request->validated();
        $scheduleDays = $data['schedule_days'];
        unset($data['schedule_days']);

        $work_timetable->update($data);
        $this->syncWorkTimetableDays($work_timetable, $scheduleDays);

        return to_route('work-timetables.index')->with('success', 'Work timetable updated.');
    }

    /**
     * Remove the work timetable when no employees use it.
     */
    public function destroy(WorkTimetable $work_timetable): RedirectResponse
    {
        if (Employee::query()->where('work_timetable_id', $work_timetable->id)->exists()) {
            return back()->withErrors([
                'work_timetable' => 'Cannot delete a work timetable that is assigned to employees.',
            ]);
        }

        $work_timetable->delete();

        return to_route('work-timetables.index')->with('success', 'Work timetable deleted.');
    }

    /**
     * @param  list<array{weekday: int, is_rest_day: bool, work_starts_at?: string|null, work_ends_at?: string|null}>  $scheduleDays
     */
    private function syncWorkTimetableDays(WorkTimetable $timetable, array $scheduleDays): void
    {
        $timetable->days()->delete();

        foreach ($scheduleDays as $row) {
            $isRest = (bool) ($row['is_rest_day'] ?? false);
            $timetable->days()->create([
                'weekday' => (int) $row['weekday'],
                'is_rest_day' => $isRest,
                'work_starts_at' => $isRest ? null : $this->normalizeStoredTime((string) ($row['work_starts_at'] ?? '')),
                'work_ends_at' => $isRest ? null : $this->normalizeStoredTime((string) ($row['work_ends_at'] ?? '')),
            ]);
        }
    }

    private function normalizeStoredTime(string $time): string
    {
        $time = trim($time);
        if (preg_match('/^\d{2}:\d{2}$/', $time)) {
            return $time.':00';
        }

        return $time;
    }
}
