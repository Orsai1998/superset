FROM docker.erg.kz/erg/cv/superset:4.1.1

#Устанавливаем пользователя root для установки пакетов и дополнений
USER root

# Устанавливаем необходимые пакеты для работы с прокси, curl, dpkg и python
RUN apt-get update && apt-get install -y \
    curl \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    python3-pip \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Установка прокси, чтобы использовать его для всех последующих операций
# ENV http_proxy=http://10.5.8.5:8080
# ENV https_proxy=http://10.5.8.5:8080

# Очистка старых данных apt
RUN rm -rf /var/lib/apt/lists/*

# Проверка версии Debian и установка репозитория Microsoft
RUN DEB_VERSION=$(grep VERSION_ID /etc/os-release | cut -d '"' -f 2 | cut -d '.' -f 1) && \
    if [ "$DEB_VERSION" -lt 8 ] || [ "$DEB_VERSION" -gt 12 ß]; then \
        echo "Debian $DEB_VERSION is not currently supported." && exit 1; \
    fi

# Скачать и установить пакет для настройки репозитория Microsoft
RUN curl -sSL -O https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb

# Обновление пакетов
RUN apt-get update -y

# Установка необходимых пакетов
RUN ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    mssql-tools \
    unixodbc-dev \
    libgssapi-krb5-2 \
    build-essential \
    libpq-dev \
    pkg-config \
    libmariadb-dev-compat \
    libmariadb-dev \
    python3-dev

# Настройка PATH для mssql-tools
RUN echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
# Настройка PATH для mssql-tools
ENV PATH="${PATH}:/opt/mssql-tools/bin"

# Установка Python пакетов через pip
RUN pip3 install python-ldap==3.4.3 \
    prophet==1.1.6 \
    flask-oidc==2.2.2 \
    flask-openid \
    playwright \
    authlib \
    pyodbc \
    psycopg2 \
    flask_cors \
    mysqlclient

# Очистка переменных прокси
ENV http_proxy=""
ENV https_proxy=""


# Проверка и создание bootstrap файла
RUN if [ ! -f ~/bootstrap ]; then \
    echo "Running Superset with uid 1000" > ~/bootstrap; \
    fi


# Указываем пользователя для запуска контейнера
USER 1000


# Запускаем контейнер с Bash
CMD ["/bin/bash"]