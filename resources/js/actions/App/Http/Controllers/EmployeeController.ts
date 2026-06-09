import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
export const downloadAttendancePdf = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttendancePdf.url(args, options),
    method: 'get',
})

downloadAttendancePdf.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/attendance/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
downloadAttendancePdf.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return downloadAttendancePdf.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
downloadAttendancePdf.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttendancePdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
downloadAttendancePdf.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadAttendancePdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
    const downloadAttendancePdfForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: downloadAttendancePdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
        downloadAttendancePdfForm.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadAttendancePdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::downloadAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:995
 * @route '/employees/{employee}/attendance/pdf'
 */
        downloadAttendancePdfForm.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadAttendancePdf.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    downloadAttendancePdf.form = downloadAttendancePdfForm
/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
export const businessCard = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCard.url(args, options),
    method: 'get',
})

businessCard.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/business-card',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
businessCard.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return businessCard.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
businessCard.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCard.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
businessCard.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: businessCard.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
    const businessCardForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: businessCard.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
        businessCardForm.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessCard.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:879
 * @route '/employees/{employee}/business-card'
 */
        businessCardForm.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessCard.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    businessCard.form = businessCardForm
/**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
export const businessCardEmbed = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCardEmbed.url(args, options),
    method: 'get',
})

businessCardEmbed.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/business-card/embed',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
businessCardEmbed.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return businessCardEmbed.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
businessCardEmbed.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCardEmbed.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
businessCardEmbed.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: businessCardEmbed.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
    const businessCardEmbedForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: businessCardEmbed.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
        businessCardEmbedForm.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessCardEmbed.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::businessCardEmbed
 * @see app/Http/Controllers/EmployeeController.php:899
 * @route '/employees/{employee}/business-card/embed'
 */
        businessCardEmbedForm.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessCardEmbed.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    businessCardEmbed.form = businessCardEmbedForm
/**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
export const downloadTemplate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadTemplate.url(options),
    method: 'get',
})

downloadTemplate.definition = {
    methods: ["get","head"],
    url: '/employees-template/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
downloadTemplate.url = (options?: RouteQueryOptions) => {
    return downloadTemplate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
downloadTemplate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadTemplate.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
downloadTemplate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadTemplate.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
    const downloadTemplateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: downloadTemplate.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
        downloadTemplateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadTemplate.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::downloadTemplate
 * @see app/Http/Controllers/EmployeeController.php:421
 * @route '/employees-template/download'
 */
        downloadTemplateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadTemplate.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    downloadTemplate.form = downloadTemplateForm
/**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/employees/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::exportMethod
 * @see app/Http/Controllers/EmployeeController.php:467
 * @route '/employees/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
/**
* @see \App\Http\Controllers\EmployeeController::importMethod
 * @see app/Http/Controllers/EmployeeController.php:616
 * @route '/employees/import'
 */
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/employees/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::importMethod
 * @see app/Http/Controllers/EmployeeController.php:616
 * @route '/employees/import'
 */
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::importMethod
 * @see app/Http/Controllers/EmployeeController.php:616
 * @route '/employees/import'
 */
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::importMethod
 * @see app/Http/Controllers/EmployeeController.php:616
 * @route '/employees/import'
 */
    const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::importMethod
 * @see app/Http/Controllers/EmployeeController.php:616
 * @route '/employees/import'
 */
        importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importMethod.url(options),
            method: 'post',
        })
    
    importMethod.form = importMethodForm
/**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
export const profile = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: profile.url(options),
    method: 'get',
})

profile.definition = {
    methods: ["get","head"],
    url: '/my-profile',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
profile.url = (options?: RouteQueryOptions) => {
    return profile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
profile.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: profile.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
profile.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: profile.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
    const profileForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: profile.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
        profileForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: profile.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::profile
 * @see app/Http/Controllers/EmployeeController.php:54
 * @route '/my-profile'
 */
        profileForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: profile.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    profile.form = profileForm
/**
* @see \App\Http\Controllers\EmployeeController::updateProfile
 * @see app/Http/Controllers/EmployeeController.php:242
 * @route '/my-profile'
 */
export const updateProfile = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateProfile.url(options),
    method: 'patch',
})

updateProfile.definition = {
    methods: ["patch"],
    url: '/my-profile',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\EmployeeController::updateProfile
 * @see app/Http/Controllers/EmployeeController.php:242
 * @route '/my-profile'
 */
updateProfile.url = (options?: RouteQueryOptions) => {
    return updateProfile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::updateProfile
 * @see app/Http/Controllers/EmployeeController.php:242
 * @route '/my-profile'
 */
updateProfile.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateProfile.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EmployeeController::updateProfile
 * @see app/Http/Controllers/EmployeeController.php:242
 * @route '/my-profile'
 */
    const updateProfileForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateProfile.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::updateProfile
 * @see app/Http/Controllers/EmployeeController.php:242
 * @route '/my-profile'
 */
        updateProfileForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateProfile.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateProfile.form = updateProfileForm
/**
* @see \App\Http\Controllers\EmployeeController::updateProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:192
 * @route '/my-profile/face-login'
 */
export const updateProfileFaceLogin = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateProfileFaceLogin.url(options),
    method: 'post',
})

updateProfileFaceLogin.definition = {
    methods: ["post"],
    url: '/my-profile/face-login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::updateProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:192
 * @route '/my-profile/face-login'
 */
updateProfileFaceLogin.url = (options?: RouteQueryOptions) => {
    return updateProfileFaceLogin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::updateProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:192
 * @route '/my-profile/face-login'
 */
updateProfileFaceLogin.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateProfileFaceLogin.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::updateProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:192
 * @route '/my-profile/face-login'
 */
    const updateProfileFaceLoginForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateProfileFaceLogin.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::updateProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:192
 * @route '/my-profile/face-login'
 */
        updateProfileFaceLoginForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateProfileFaceLogin.url(options),
            method: 'post',
        })
    
    updateProfileFaceLogin.form = updateProfileFaceLoginForm
/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:221
 * @route '/my-profile/face-login'
 */
export const destroyProfileFaceLogin = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProfileFaceLogin.url(options),
    method: 'delete',
})

destroyProfileFaceLogin.definition = {
    methods: ["delete"],
    url: '/my-profile/face-login',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:221
 * @route '/my-profile/face-login'
 */
destroyProfileFaceLogin.url = (options?: RouteQueryOptions) => {
    return destroyProfileFaceLogin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:221
 * @route '/my-profile/face-login'
 */
destroyProfileFaceLogin.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProfileFaceLogin.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroyProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:221
 * @route '/my-profile/face-login'
 */
    const destroyProfileFaceLoginForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyProfileFaceLogin.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::destroyProfileFaceLogin
 * @see app/Http/Controllers/EmployeeController.php:221
 * @route '/my-profile/face-login'
 */
        destroyProfileFaceLoginForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyProfileFaceLogin.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyProfileFaceLogin.form = destroyProfileFaceLoginForm
/**
* @see \App\Http\Controllers\EmployeeController::uploadProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:260
 * @route '/my-profile/documents'
 */
export const uploadProfileDocument = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadProfileDocument.url(options),
    method: 'post',
})

uploadProfileDocument.definition = {
    methods: ["post"],
    url: '/my-profile/documents',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::uploadProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:260
 * @route '/my-profile/documents'
 */
uploadProfileDocument.url = (options?: RouteQueryOptions) => {
    return uploadProfileDocument.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::uploadProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:260
 * @route '/my-profile/documents'
 */
uploadProfileDocument.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadProfileDocument.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::uploadProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:260
 * @route '/my-profile/documents'
 */
    const uploadProfileDocumentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: uploadProfileDocument.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::uploadProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:260
 * @route '/my-profile/documents'
 */
        uploadProfileDocumentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: uploadProfileDocument.url(options),
            method: 'post',
        })
    
    uploadProfileDocument.form = uploadProfileDocumentForm
/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:294
 * @route '/my-profile/documents/{employee_document}'
 */
export const destroyProfileDocument = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProfileDocument.url(args, options),
    method: 'delete',
})

destroyProfileDocument.definition = {
    methods: ["delete"],
    url: '/my-profile/documents/{employee_document}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:294
 * @route '/my-profile/documents/{employee_document}'
 */
destroyProfileDocument.url = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_document: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_document: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_document: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_document: typeof args.employee_document === 'object'
                ? args.employee_document.id
                : args.employee_document,
                }

    return destroyProfileDocument.definition.url
            .replace('{employee_document}', parsedArgs.employee_document.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroyProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:294
 * @route '/my-profile/documents/{employee_document}'
 */
destroyProfileDocument.delete = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyProfileDocument.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroyProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:294
 * @route '/my-profile/documents/{employee_document}'
 */
    const destroyProfileDocumentForm = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyProfileDocument.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::destroyProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:294
 * @route '/my-profile/documents/{employee_document}'
 */
        destroyProfileDocumentForm.delete = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyProfileDocument.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyProfileDocument.form = destroyProfileDocumentForm
/**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
export const showProfileDocument = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showProfileDocument.url(args, options),
    method: 'get',
})

showProfileDocument.definition = {
    methods: ["get","head"],
    url: '/my-profile/documents/{employee_document}/view',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
showProfileDocument.url = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_document: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_document: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_document: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_document: typeof args.employee_document === 'object'
                ? args.employee_document.id
                : args.employee_document,
                }

    return showProfileDocument.definition.url
            .replace('{employee_document}', parsedArgs.employee_document.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
showProfileDocument.get = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showProfileDocument.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
showProfileDocument.head = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showProfileDocument.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
    const showProfileDocumentForm = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showProfileDocument.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
        showProfileDocumentForm.get = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showProfileDocument.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::showProfileDocument
 * @see app/Http/Controllers/EmployeeController.php:312
 * @route '/my-profile/documents/{employee_document}/view'
 */
        showProfileDocumentForm.head = (args: { employee_document: number | { id: number } } | [employee_document: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showProfileDocument.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showProfileDocument.form = showProfileDocumentForm
/**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
export const downloadProfileAttendancePdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadProfileAttendancePdf.url(options),
    method: 'get',
})

downloadProfileAttendancePdf.definition = {
    methods: ["get","head"],
    url: '/my-profile/attendance/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
downloadProfileAttendancePdf.url = (options?: RouteQueryOptions) => {
    return downloadProfileAttendancePdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
downloadProfileAttendancePdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadProfileAttendancePdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
downloadProfileAttendancePdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadProfileAttendancePdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
    const downloadProfileAttendancePdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: downloadProfileAttendancePdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
        downloadProfileAttendancePdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadProfileAttendancePdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::downloadProfileAttendancePdf
 * @see app/Http/Controllers/EmployeeController.php:969
 * @route '/my-profile/attendance/pdf'
 */
        downloadProfileAttendancePdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadProfileAttendancePdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    downloadProfileAttendancePdf.form = downloadProfileAttendancePdfForm
/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/employees',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:340
 * @route '/employees'
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
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/employees/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:396
 * @route '/employees/create'
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
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:836
 * @route '/employees'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/employees',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:836
 * @route '/employees'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:836
 * @route '/employees'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:836
 * @route '/employees'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:836
 * @route '/employees'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
export const show = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
show.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return show.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
show.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
show.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
    const showForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
        showForm.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:1050
 * @route '/employees/{employee}'
 */
        showForm.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
export const edit = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
edit.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return edit.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
edit.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
edit.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
    const editForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
        editForm.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:1063
 * @route '/employees/{employee}/edit'
 */
        editForm.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
export const update = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
update.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return update.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
update.put = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
update.patch = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
    const updateForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
        updateForm.put = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:1210
 * @route '/employees/{employee}'
 */
        updateForm.patch = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:1291
 * @route '/employees/{employee}'
 */
export const destroy = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:1291
 * @route '/employees/{employee}'
 */
destroy.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return destroy.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:1291
 * @route '/employees/{employee}'
 */
destroy.delete = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:1291
 * @route '/employees/{employee}'
 */
    const destroyForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:1291
 * @route '/employees/{employee}'
 */
        destroyForm.delete = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\EmployeeController::updatePrivateInformation
 * @see app/Http/Controllers/EmployeeController.php:1270
 * @route '/employees/{employee}/private-information'
 */
export const updatePrivateInformation = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePrivateInformation.url(args, options),
    method: 'patch',
})

updatePrivateInformation.definition = {
    methods: ["patch"],
    url: '/employees/{employee}/private-information',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\EmployeeController::updatePrivateInformation
 * @see app/Http/Controllers/EmployeeController.php:1270
 * @route '/employees/{employee}/private-information'
 */
updatePrivateInformation.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return updatePrivateInformation.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::updatePrivateInformation
 * @see app/Http/Controllers/EmployeeController.php:1270
 * @route '/employees/{employee}/private-information'
 */
updatePrivateInformation.patch = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePrivateInformation.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EmployeeController::updatePrivateInformation
 * @see app/Http/Controllers/EmployeeController.php:1270
 * @route '/employees/{employee}/private-information'
 */
    const updatePrivateInformationForm = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePrivateInformation.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::updatePrivateInformation
 * @see app/Http/Controllers/EmployeeController.php:1270
 * @route '/employees/{employee}/private-information'
 */
        updatePrivateInformationForm.patch = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePrivateInformation.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updatePrivateInformation.form = updatePrivateInformationForm
/**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
export const showDocument = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showDocument.url(args, options),
    method: 'get',
})

showDocument.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/documents/{employee_document}/view',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
showDocument.url = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                    employee_document: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                                employee_document: typeof args.employee_document === 'object'
                ? args.employee_document.id
                : args.employee_document,
                }

    return showDocument.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace('{employee_document}', parsedArgs.employee_document.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
showDocument.get = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showDocument.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
showDocument.head = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showDocument.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
    const showDocumentForm = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showDocument.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
        showDocumentForm.get = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showDocument.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::showDocument
 * @see app/Http/Controllers/EmployeeController.php:1325
 * @route '/employees/{employee}/documents/{employee_document}/view'
 */
        showDocumentForm.head = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showDocument.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showDocument.form = showDocumentForm
/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:1309
 * @route '/employees/{employee}/documents/{employee_document}'
 */
export const destroyDocument = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyDocument.url(args, options),
    method: 'delete',
})

destroyDocument.definition = {
    methods: ["delete"],
    url: '/employees/{employee}/documents/{employee_document}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:1309
 * @route '/employees/{employee}/documents/{employee_document}'
 */
destroyDocument.url = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                    employee_document: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                                employee_document: typeof args.employee_document === 'object'
                ? args.employee_document.id
                : args.employee_document,
                }

    return destroyDocument.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace('{employee_document}', parsedArgs.employee_document.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:1309
 * @route '/employees/{employee}/documents/{employee_document}'
 */
destroyDocument.delete = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyDocument.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:1309
 * @route '/employees/{employee}/documents/{employee_document}'
 */
    const destroyDocumentForm = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyDocument.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:1309
 * @route '/employees/{employee}/documents/{employee_document}'
 */
        destroyDocumentForm.delete = (args: { employee: number | { id: number }, employee_document: number | { id: number } } | [employee: number | { id: number }, employee_document: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyDocument.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyDocument.form = destroyDocumentForm
const EmployeeController = { downloadAttendancePdf, businessCard, businessCardEmbed, downloadTemplate, exportMethod, importMethod, profile, updateProfile, updateProfileFaceLogin, destroyProfileFaceLogin, uploadProfileDocument, destroyProfileDocument, showProfileDocument, downloadProfileAttendancePdf, index, create, store, show, edit, update, destroy, updatePrivateInformation, showDocument, destroyDocument, export: exportMethod, import: importMethod }

export default EmployeeController