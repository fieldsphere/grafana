package notifier

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/prometheus/alertmanager/cluster/clusterpb"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

func TestNewRedisChannel(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	defer mr.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	p := &redisPeer{
		redis: rdb,
	}

	t.Run("default queue size when 0 is passed", func(t *testing.T) {
		channel := newRedisChannel(p, "testKey", "testChannel", "testType", 0)
		require.NotNil(t, channel)
		require.Equal(t, 200, cap(channel.(*RedisChannel).msgc))
	})

	t.Run("custom queue size", func(t *testing.T) {
		channel := newRedisChannel(p, "testKey", "testChannel", "testType", 500)
		require.NotNil(t, channel)
		require.Equal(t, 500, cap(channel.(*RedisChannel).msgc))
	})
}

func TestBroadcastAndHandleMessages(t *testing.T) {
	const channelName = "testChannel"

	mr, err := miniredis.Run()
	require.NoError(t, err)
	defer mr.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	p := &redisPeer{
		redis:            rdb,
		messagesSent:     prometheus.NewCounterVec(prometheus.CounterOpts{}, []string{update}),
		messagesSentSize: prometheus.NewCounterVec(prometheus.CounterOpts{}, []string{update}),
	}

	channel := newRedisChannel(p, "testKey", channelName, "testType", 0).(*RedisChannel)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pubSub := rdb.Subscribe(ctx, channelName)
	defer pubSub.Close()

	// Wait for the subscription to be active before broadcasting.
	_, err = pubSub.Receive(ctx)
	require.NoError(t, err)

	msgs := pubSub.Channel()

	msg := []byte("test message")
	channel.Broadcast(msg)

	var receivedMsg *redis.Message
	require.Eventually(t, func() bool {
		select {
		case receivedMsg = <-msgs:
			return true
		default:
			return false
		}
	}, time.Second, 10*time.Millisecond)

	var part clusterpb.Part
	err = part.Unmarshal([]byte(receivedMsg.Payload))
	require.NoError(t, err)

	require.Equal(t, channelName, receivedMsg.Channel)
	require.Equal(t, msg, part.Data)
}
