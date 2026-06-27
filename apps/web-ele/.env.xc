VITE_BASE=/

# 内网现场构建：交给部署服务器反代 /api 到本机 127.* 后端服务
VITE_GLOB_API_URL=/api

# 是否开启压缩，可以设置为 none, brotli, gzip
VITE_COMPRESS=none

# 是否开启 PWA
VITE_PWA=false

# vue-router 的模式
VITE_ROUTER_HISTORY=hash

# 是否注入全局loading
VITE_INJECT_APP_LOADING=true

# 打包后将 dist 目录内容压缩为 xc_web.zip（zip 内含 xc_web/ 目录）
VITE_ARCHIVER=true
VITE_ARCHIVER_NAME=xc_web
