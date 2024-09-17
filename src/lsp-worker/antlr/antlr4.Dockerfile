FROM openjdk:24-bullseye
COPY --from=python:3.12-bullseye / /

RUN pip3 install antlr4-tools
RUN antlr4 -v 4.13.2

ENTRYPOINT [ "antlr4", "-v", "4.13.2" ]
