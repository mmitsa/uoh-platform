FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "apps/api/UohMeetings.Api/UohMeetings.Api.csproj"
RUN dotnet publish "apps/api/UohMeetings.Api/UohMeetings.Api.csproj" -c Release -o /out /p:UseAppHost=false

FROM runtime
WORKDIR /app
COPY --from=build /out .
RUN adduser --disabled-password --gecos "" appuser
USER appuser
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENTRYPOINT ["dotnet","UohMeetings.Api.dll"]

