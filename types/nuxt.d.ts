import type { ApiService } from '~/services' 

declare module '#app' {
  interface NuxtApp {
    $api: ApiService
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: ApiService
  }
}