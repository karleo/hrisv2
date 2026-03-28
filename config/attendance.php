<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Grace window (minutes)
    |--------------------------------------------------------------------------
    |
    | Clock-in within this many minutes of scheduled start still counts as "on time".
    | Clock-out within this many minutes of scheduled end still counts as "on time".
    | Outside the window toward early side → early / left early; toward late → late / overtime.
    |
    */
    'grace_minutes' => (int) env('ATTENDANCE_GRACE_MINUTES', 5),

];
