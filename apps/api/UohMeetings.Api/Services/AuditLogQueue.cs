using System.Threading.Channels;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class AuditLogQueue
{
    private readonly Channel<AuditLogEntry> _channel = Channel.CreateUnbounded<AuditLogEntry>();

    public ChannelWriter<AuditLogEntry> Writer => _channel.Writer;
    public ChannelReader<AuditLogEntry> Reader => _channel.Reader;
}
