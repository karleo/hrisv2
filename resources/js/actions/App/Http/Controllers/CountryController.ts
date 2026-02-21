import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/countries',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::index
* @see app/Http/Controllers/CountryController.php:18
* @route '/countries'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/countries/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::create
* @see app/Http/Controllers/CountryController.php:41
* @route '/countries/create'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\CountryController::store
* @see app/Http/Controllers/CountryController.php:49
* @route '/countries'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/countries',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CountryController::store
* @see app/Http/Controllers/CountryController.php:49
* @route '/countries'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::store
* @see app/Http/Controllers/CountryController.php:49
* @route '/countries'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CountryController::store
* @see app/Http/Controllers/CountryController.php:49
* @route '/countries'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CountryController::store
* @see app/Http/Controllers/CountryController.php:49
* @route '/countries'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
export const show = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/countries/{country}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
show.url = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { country: args }
    }

    if (Array.isArray(args)) {
        args = {
            country: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        country: args.country,
    }

    return show.definition.url
            .replace('{country}', parsedArgs.country.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
show.get = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
show.head = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
const showForm = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
showForm.get = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::show
* @see app/Http/Controllers/CountryController.php:0
* @route '/countries/{country}'
*/
showForm.head = (args: { country: string | number } | [country: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
export const edit = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/countries/{country}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
edit.url = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { country: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { country: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            country: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        country: typeof args.country === 'object'
        ? args.country.id
        : args.country,
    }

    return edit.definition.url
            .replace('{country}', parsedArgs.country.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
edit.get = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
edit.head = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
const editForm = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
editForm.get = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CountryController::edit
* @see app/Http/Controllers/CountryController.php:62
* @route '/countries/{country}/edit'
*/
editForm.head = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
export const update = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/countries/{country}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
update.url = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { country: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { country: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            country: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        country: typeof args.country === 'object'
        ? args.country.id
        : args.country,
    }

    return update.definition.url
            .replace('{country}', parsedArgs.country.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
update.put = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
update.patch = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
const updateForm = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
updateForm.put = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CountryController::update
* @see app/Http/Controllers/CountryController.php:72
* @route '/countries/{country}'
*/
updateForm.patch = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\CountryController::destroy
* @see app/Http/Controllers/CountryController.php:85
* @route '/countries/{country}'
*/
export const destroy = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/countries/{country}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CountryController::destroy
* @see app/Http/Controllers/CountryController.php:85
* @route '/countries/{country}'
*/
destroy.url = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { country: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { country: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            country: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        country: typeof args.country === 'object'
        ? args.country.id
        : args.country,
    }

    return destroy.definition.url
            .replace('{country}', parsedArgs.country.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CountryController::destroy
* @see app/Http/Controllers/CountryController.php:85
* @route '/countries/{country}'
*/
destroy.delete = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\CountryController::destroy
* @see app/Http/Controllers/CountryController.php:85
* @route '/countries/{country}'
*/
const destroyForm = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CountryController::destroy
* @see app/Http/Controllers/CountryController.php:85
* @route '/countries/{country}'
*/
destroyForm.delete = (args: { country: number | { id: number } } | [country: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const CountryController = { index, create, store, show, edit, update, destroy }

export default CountryController