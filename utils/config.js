// 后端服务器配置文件

// 获取后端服务器基础URL
function getServerURL() {
	// #ifdef H5
	// H5平台（浏览器环境）
	// 开发环境使用 localhost:3000
	if (process.env.NODE_ENV === 'development') {
		return 'http://localhost:3000'
	}
	// 生产环境可以配置实际的服务器地址
	return 'http://your-production-server.com'
	// #endif
	
	// #ifndef H5
	// 其他平台（App、小程序等）直接访问
	return 'http://localhost:3000'
	// #endif
}

// 获取后端API完整地址
export function getApiUrl(path) {
	const baseUrl = getServerURL()
	// 确保路径以 / 开头
	const apiPath = path.startsWith('/') ? path : `/${path}`
	return `${baseUrl}${apiPath}`
}

// 导出基础URL供直接使用
export const SERVER_URL = getServerURL()

export default {
	getApiUrl,
	SERVER_URL
}


