package com.portfolio.blog.repository;

import com.portfolio.blog.model.PageView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PageViewRepository extends JpaRepository<PageView, Long> {

    long count();

    @Query("SELECT pv.pagePath, COUNT(pv) FROM PageView pv GROUP BY pv.pagePath ORDER BY COUNT(pv) DESC")
    List<Object[]> getTopPages();

    @Query("SELECT COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= CURRENT_DATE")
    long countToday();

    @Query("SELECT pv FROM PageView pv WHERE pv.viewedAt >= CURRENT_DATE ORDER BY pv.viewedAt ASC")
    List<PageView> findTodayViews();
}
