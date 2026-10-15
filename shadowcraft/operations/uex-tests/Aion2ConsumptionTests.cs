using CUE4Parse.GameTypes.Aion2.Objects;
using CUE4Parse.UE4.Exceptions;
using CUE4Parse.UE4.Readers;
using Xunit;

namespace Uex.Tests;

// Copy into the research uex checkout's tests/Uex.Tests after applying the guard.
// Synthetic bytes only; no game files, credentials or mappings required.
public class Aion2ConsumptionTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(4, 4)]
    public void Complete_read_passes(int length, int position)
    {
        using var archive = new FByteArchive("synthetic", new byte[length]);
        archive.Position = position;
        FAion2DatFileArchive.RequireFullyConsumed(archive);
    }

    [Theory]
    [InlineData(4, 0)]
    [InlineData(4, 3)]
    [InlineData(4, 5)]
    public void Partial_or_overread_fails_without_advancing_position(int length, int position)
    {
        using var archive = new FByteArchive("synthetic", new byte[length]);
        archive.Position = position;
        Assert.Throws<ParserException>(() => FAion2DatFileArchive.RequireFullyConsumed(archive));
        Assert.Equal((long) position, archive.Position);
    }
}
