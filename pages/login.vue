<template>
	<div class="mx-0 my-0 login-wrapper flex align-center justify-center md:justify-start md:px-[190px]">
		<div id="loginForm" class="d-flex align-center mx-auto justify-center my-auto">
			<div class="form-wrapper pa-12 flex z-10 relative rounded-lg overflow-hidden bg-white">
				<div class="mx-auto min-width-[520px] flex form-container">
					<form @submit.prevent="onSubmit" class="py-6 px-5 md:py-10 md:px-10 form-login my-5 w-[520px]">
						<p class="text-center text-2xl md:text-[32px] font-bold mb-1">Đăng nhập</p>
						<p class="text-center text-md mb-3 text-gray-500">Vui lòng đăng nhập để sử dụng dịch vụ</p>

						<UFormField class="mb-3" label="Tên đăng nhập" :error="flagSubmit ? dataErrors.login : ''" :size="'xl'">
							<UInput v-model="login" placeholder="Tên đăng nhập" class="w-full" />
						</UFormField>
						<UFormField class="mb-3" label="Mật khẩu" :error="flagSubmit ? dataErrors.password : ''" :size="'xl'">
							<UInput v-model="password" type="password" placeholder="Mật khẩu" class="w-full" />
						</UFormField>

						<div>
							<!-- <div class="mb-4 text-sm leading-6">
								<input v-model="rememberMe" id="rememberMe" name="rememberMe" type="checkbox"
									class="appearance-none hidden h-0" />
								<label for="rememberMe" class="font-mediumcursor-pointer flex gap-[8px] items-center">
									<Icon v-show="rememberMe" name="fluent:checkbox-checked-20-filled" size="24px"
										class="rouned m-0 p-0" />
									<Icon v-show="!rememberMe" name="fluent:checkbox-unchecked-20-regular" size="24px"
										class="rouned m-0 p-0 " />
									Ghi nhớ
								</label>
							</div> -->
							<UButton
								as="button"
								:loading="loading"
								class="hidden lg:flex cursor-pointer text-white items-center justify-center min-w-[150px] gap-2 px-4 py-3 rounded-md bg-primary-gradient text-sm whitespace-nowrap w-full"
								type="submit"
								trailing
								:size="'xl'"
							>
								<span>Đăng nhập</span>
							</UButton>

							<p v-if="loginErrorMsg" class="mt-2 text-sm text-red-500 text-center" id="email-error">
								{{ loginErrorMsg }}
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<!-- <script setup lang="ts">
	definePageMeta({ layout: 'blank' });
</script> -->

<script lang="ts">
	import type { CookieOptions, apiResponde } from '~/models/index';
	import { useAuthStore } from '~/store/auth';
	import { useCustomToast } from '@/composable/useCustomToast';

	export default {
		setup() {
			useHead({
				title: 'Đăng nhập',
				meta: [{ name: 'description', content: 'Đăng nhập' }],
				bodyAttrs: {
					class: 'test',
				},
			});
			const authStore = useAuthStore();
			const { $api } = useNuxtApp();
			const router = useRouter();
			const rememberMe = ref<Boolean>(true);
			const CookieOptions: CookieOptions = { maxAge: 30 * 24 * 60 * 60, sameSite: 'lax' };
			const authCookie = useCookie('auth-token', CookieOptions);

			const getUserInfo = async (_token?: string) => {
				await $api.user
					.getUserInfo(_token || '')
					.then((res: apiResponde) => {
						const rs = res as apiResponde;
						const user: Record<string, any> = rs.data.user;
						if (_token) {
							authStore.setUser({ ...user, name: user.name, id: user.id, token: _token });
							authStore.setToken(_token);
							authCookie.value = _token;
						}
						router.push('/');
					})
					.catch((err: any) => {
						console.log(err);
					});
			};
			onMounted(() => {
				if (authCookie.value) {
					getUserInfo(authCookie.value);
				}
			});
			const api = $api;
			definePageMeta({ layout: 'blank' });
			const { successToast, errorToast } = useCustomToast();
			return {
				getUserInfo,
				authStore,
				authCookie,
				router,
				api,
				rememberMe,
				successToast,
				errorToast,
			};
		},
		data: (): Record<string, any> => ({
			form: false,
			login: '' as string,
			password: '' as string,
			loading: false,
			showForm: false,
			error: null,
			flagSubmit: false,
			loginErrorMsg: '',
		}),
		computed: {
			dataRules(): Record<string, string[]> {
				return {
					login: ['required'],
					password: ['required'],
				};
			},

			dataErrors() {
				return getDataErrors(this.dataRules, { login: this.login, password: this.password });
			},
		},
		mounted() {
			setTimeout(() => {
				this.showForm = true;
			}, 300);
			// if (this.rememberMe) {
			// 	this.login = localStorage.getItem('account') || '';
			// 	this.password = localStorage.getItem('password') || '';
			// }
		},
		methods: {
			clearAuth() {
				this.authStore.logout();
			},
			async onSubmit() {
				this.flagSubmit = true;
				const authStore = useAuthStore();
				if (Object.keys(this.dataErrors).length) {
					return;
				}
				const body = {
					login: this.login,
					password: this.password,
				};

				this.loading = true;
				await this.$api.user
					.login(body)
					.then(
						(res: apiResponde) => {
							const rs = res as apiResponde;
							// Local server trả { data: { token, user: {...} } }
							const user: Record<string, any> = rs.data?.user ?? rs.data;
							const token: string = rs.data?.token ?? '';
							console.log(authStore);

							authStore.setUser({ ...user, name: user.name, id: user.id, token });
							authStore.setToken(token);
							this.authCookie = token;
							authStore.getUserInfo();
							this.loginErrorMsg = '';

							const { rTo } = this.$route.query;
							if (rTo) {
								try {
									this.router.push(JSON.parse(`${rTo}`));
								} catch (error) {
									this.router.push('/');
								}
							} else {
								this.router.push('/');
							}
						},
						(error: apiResponde) => {
							this.loginErrorMsg = error.data?.message || 'Đăng nhập thất bại, vui lòng thử lại.';
							this.errorToast({ title: 'Failed on Login: ' + error.data?.message });
						},
					)
					.catch((err: any) => {
						console.log(err);
						this.loginErrorMsg = err || 'Đăng nhập thất bại, vui lòng thử lại.';

						this.error = err;
					})
					.finally(() => {
						this.loading = false;
					});
			},
			required(v: string) {
				return !!v || 'Field is required';
			},
			setLoginText(e: Event) {
				const input = e.target as HTMLInputElement | null;
				if (input) {
					this.login = input.value;
				}
			},
		},
	};
</script>

<style lang="scss">
	.login-wrapper {
		background-size: cover;
		background-repeat: no-repeat;
		position: relative;
		min-height: calc(100vh);
		background: linear-gradient(114.67deg, #2e7d32 0%, #37a35f 100%) !important;
		.form-container {
			width: 580px;
			max-width: 90vw;
			/* height: 580px; */
			max-height: 80vh;

			.preview-img {
				flex-grow: 1;
			}

			.form-login {
				flex-grow: 2;
			}
		}
	}

	.form-wrapper {
		border: 1px solid #ffffff;
	}
</style>
