const toast = useToast();

type ToastMsg = {
	title?: string;
	description?: string;
};

type CustomToastComposable = {
	successToast: (toast_msg: ToastMsg) => void;
	errorToast: (toast_msg: ToastMsg) => void;
};

export const useCustomToast = (): CustomToastComposable => {
	const successToast = (toast_msg: ToastMsg) => {
		toast.add({ type: 'background', color: 'primary', title: toast_msg.title, description: toast_msg.description });
	};

	const errorToast = (toast_msg: ToastMsg) => {
		toast.add({ type: 'background', color: 'error', title: toast_msg.title, description: toast_msg.description });
	};

	return {
		successToast,
		errorToast,
	};
};
