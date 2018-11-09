FROM amazonlinux

RUN yum install tar gzip -y

ENV NVM_VERSION v0.33.11
ENV NODE_VERSION v8.1.0
ENV NVM_DIR /usr/local/nvm
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh | bash

RUN source $NVM_DIR/nvm.sh \
	&& nvm install $NODE_VERSION \
	&& nvm alias default $NODE_VERSION \
	&& nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

RUN node -v
RUN npm -v

COPY . /app

WORKDIR /app
VOLUME /app

CMD node .

EXPOSE 8081
