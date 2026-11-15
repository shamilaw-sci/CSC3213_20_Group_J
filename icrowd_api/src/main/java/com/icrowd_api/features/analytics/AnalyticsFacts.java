package com.icrowd_api.features.analytics;

import com.icrowd_api.features.analytics.dto.AnalyticsSummaryDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;

/** Aggregates sales in the database without materializing historical order graphs. */
@Repository @RequiredArgsConstructor @Transactional(readOnly=true)
public class AnalyticsFacts {
    private final EntityManager em;
    private static final String FILTER = "o.status in :statuses and o.paymentStatus in :payments and o.createdAt between :start and :end";
    private static final String COST = "coalesce(i.costPriceAtTimeOfPurchase,i.priceAtTimeOfPurchase*0.60)";
    public record ProductSales(Long id, String category, int units, BigDecimal revenue, BigDecimal cost, long estimatedUnits) {}
    public record PeriodSales(LocalDateTime time, String category, int units, BigDecimal revenue, BigDecimal cost) {}
    public record Facts(int orderCount, BigDecimal discounts, LocalDate firstSale, List<ProductSales> products,
                        List<PeriodSales> periods, AnalyticsSummaryDto.CustomerAnalyticsDto customers) {}
    private <T> TypedQuery<T> query(String sql, Class<T> type, LocalDateTime start, LocalDateTime end) {
        return em.createQuery(sql,type).setParameter("statuses",AnalyticsService.QUALIFYING_ORDER_STATUSES)
            .setParameter("payments",AnalyticsService.QUALIFYING_PAYMENT_STATUSES)
            .setParameter("start",start==null ? LocalDate.of(1970,1,1).atStartOfDay() : start).setParameter("end",end);
    }
    private BigDecimal decimal(Object value) { return value==null ? BigDecimal.ZERO : new BigDecimal(value.toString()).setScale(2,RoundingMode.HALF_UP); }
    private int number(Object value) { return value==null ? 0 : Math.toIntExact(((Number)value).longValue()); }
    public Facts read(LocalDateTime start, LocalDateTime end, LocalDateTime chartStart, boolean hourly) {
        Object[] totals = query("select count(o),sum(o.discountAmount),min(o.createdAt) from Order o where "+FILTER,Object[].class,start,end).getSingleResult();
        var products = query("select p.id,c.name,sum(i.quantity),sum(i.priceAtTimeOfPurchase*i.quantity),sum("+COST+"*i.quantity),sum(case when i.costPriceAtTimeOfPurchase is null then i.quantity else 0 end) from OrderItem i join i.order o join i.product p join p.category c where "+FILTER+" group by p.id,c.name",Object[].class,start,end)
            .getResultList().stream().map(r -> new ProductSales((Long)r[0],(String)r[1],number(r[2]),decimal(r[3]),decimal(r[4]),((Number)r[5]).longValue())).toList();
        String bucket = hourly ? "extract(hour from o.createdAt)" : "0";
        String date = "cast(o.createdAt as LocalDate)";
        var periods = query("select "+date+","+bucket+",c.name,sum(i.quantity),sum(i.priceAtTimeOfPurchase*i.quantity),sum("+COST+"*i.quantity) from OrderItem i join i.order o join i.product p join p.category c where "+FILTER+" group by "+date+(hourly ? ","+bucket : "")+",c.name order by "+date,Object[].class,chartStart,end)
            .getResultList().stream().map(r -> new PeriodSales(((LocalDate)r[0]).atTime(number(r[1]),0),(String)r[2],number(r[3]),decimal(r[4]),decimal(r[5]))).toList();
        int buyers = query("select count(distinct o.user.id) from Order o where "+FILTER,Long.class,start,end).getSingleResult().intValue();
        int repeat = query("select count(distinct o.user.id) from Order o where "+FILTER+" and (select count(o2) from Order o2 where o2.user.id=o.user.id and "+FILTER.replace("o.","o2.")+")>=2",Long.class,start,end).getSingleResult().intValue();
        var top = query("select coalesce(c.firstName,a.firstName,''),coalesce(c.lastName,a.lastName,''),u.email,count(o),sum(o.totalAmount),max(o.createdAt) from Order o join o.user u left join u.customer c left join u.admin a where "+FILTER+" group by u.id,c.firstName,a.firstName,c.lastName,a.lastName,u.email order by sum(o.totalAmount) desc",Object[].class,start,end).setMaxResults(5).getResultList().stream()
            .map(r -> AnalyticsSummaryDto.TopCustomerDto.builder().name(r[0]+" "+r[1]).email((String)r[2]).orderCount(number(r[3])).totalSpent(decimal(r[4])).lastOrderDate(((LocalDateTime)r[5]).toLocalDate().toString()).build()).toList();
        BigDecimal revenue=products.stream().map(ProductSales::revenue).reduce(BigDecimal.ZERO,BigDecimal::add);
        int count=number(totals[0]);
        var customers=AnalyticsSummaryDto.CustomerAnalyticsDto.builder().totalCustomers(buyers).repeatCustomerCount(repeat)
            .repeatPurchaseRate(buyers==0 ? 0.0 : Math.round(1000.0*repeat/buyers)/10.0)
            .averageOrderValue(count==0 ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(count),2,RoundingMode.HALF_UP))
            .customerLifetimeValue(buyers==0 ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(buyers),2,RoundingMode.HALF_UP)).topCustomers(top).build();
        return new Facts(count,decimal(totals[1]),totals[2]==null ? end.toLocalDate() : ((LocalDateTime)totals[2]).toLocalDate(),products,periods,customers);
    }
}
