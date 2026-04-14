# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
FROM node:16-alpine AS build

WORKDIR /home/superset-websocket

COPY . ./

# Установка прокси, чтобы использовать его для всех последующих операций c установкой пакетов
#ENV http_proxy=http://10.5.8.5:8080
#ENV https_proxy=http://10.5.8.5:8080

RUN npm ci && \
  npm run build

# Очистка переменных прокси
ENV http_proxy=""
ENV https_proxy=""

FROM node:16-alpine

ENV NODE_ENV=production
WORKDIR /home/superset-websocket

COPY --from=build /home/superset-websocket/dist ./dist
COPY package*.json ./

# Установка прокси, чтобы использовать его для всех последующих операций c установкой пакетов
#ENV http_proxy=http://10.5.8.5:8080
#ENV https_proxy=http://10.5.8.5:8080

# Only install production dependencies
RUN npm ci --omit=dev

# Очистка переменных прокси
ENV http_proxy=""
ENV https_proxy=""

# Don't run as root!
USER node

CMD [ "npm", "start" ]
